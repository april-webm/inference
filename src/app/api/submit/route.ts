import { NextResponse } from 'next/server'
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from '@/lib/supabase/server'

const MAX_SUBMISSIONS_PER_ROUND = 3
const MAX_ANSWER_LENGTH = 10_000
const MAX_REASONING_LENGTH = 50_000

const ROUND_1_HORSES = [
  'Shadowfax', 'Iron Duke', 'Morningstar', 'Red Tide',
  'Gallant Fox', 'Blue Streak', 'Copper Prince', 'Last Chance',
]

function validateRound1(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
    return 'Answer must be a JSON object.'
  }
  const obj = answer as Record<string, unknown>
  for (const h of ROUND_1_HORSES) {
    if (!(h in obj)) return `Missing horse: ${h}`
    if (typeof obj[h] !== 'number') return `Stake for ${h} must be a number.`
    if ((obj[h] as number) < 0) return `Stake for ${h} must be non-negative.`
  }
  const total = ROUND_1_HORSES.reduce((sum, h) => sum + (obj[h] as number), 0)
  if (total > 10_000 + 1e-6) return `Total stake ${total.toFixed(2)} exceeds £10,000.`
  return null
}

function validateRound2(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null) return 'Answer must be a JSON object.'
  const obj = answer as Record<string, unknown>
  if (!Array.isArray(obj.strategy)) return "Missing 'strategy' array."
  if (obj.strategy.length !== 21) return `Strategy must have 21 entries (got ${obj.strategy.length}).`
  const expected = Array.from({ length: 21 }, (_, i) => i * 50)
  for (let i = 0; i < 21; i++) {
    const row = obj.strategy[i] as Record<string, unknown>
    if (row?.signal !== expected[i]) return `Entry ${i}: expected signal=${expected[i]}.`
    const bid = row?.bid as number
    const ask = row?.ask as number
    if (typeof bid !== 'number' || typeof ask !== 'number') return `Entry ${i}: bid and ask must be numbers.`
    if (!(bid >= 0 && bid <= ask && ask <= 1200)) return `Entry ${i}: require 0 ≤ bid ≤ ask ≤ 1200.`
  }
  return null
}

function validateRound3(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
    return 'Answer must be a JSON object.'
  }
  const valid = new Set([
    'underlying', 'call_10000', 'call_30000', 'call_60000', 'call_120000',
    'call_150000', 'call_180000', 'call_240000', 'put_10000', 'put_30000',
    'put_60000', 'put_120000', 'put_150000', 'put_180000', 'put_240000',
    'put_480000', 'put_1000000',
  ])
  const obj = answer as Record<string, unknown>
  for (const k of Object.keys(obj)) {
    if (!valid.has(k)) return `Unknown instrument: ${k}`
    if (typeof obj[k] !== 'number') return `Allocation for ${k} must be a number.`
  }
  const totalAbs = Object.values(obj).reduce((s, v) => (s as number) + Math.abs(v as number), 0) as number
  if (totalAbs > 200) return `Total gross allocation ${totalAbs.toFixed(1)}% exceeds 200%.`
  return null
}

const VALIDATORS: Record<number, (a: unknown) => string | null> = {
  1: validateRound1,
  2: validateRound2,
  3: validateRound3,
}

export async function POST(request: Request) {
  const session = await createSupabaseServerClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { roundId?: unknown; answer?: unknown; reasoning?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const { roundId, answer, reasoning } = body
  if (typeof roundId !== 'string' || typeof answer !== 'string' || typeof reasoning !== 'string') {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  if (reasoning.length < 50) {
    return NextResponse.json(
      { error: 'Reasoning must be at least 50 characters.' },
      { status: 400 }
    )
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    return NextResponse.json(
      { error: `Answer must be under ${MAX_ANSWER_LENGTH.toLocaleString()} characters.` },
      { status: 400 }
    )
  }

  if (reasoning.length > MAX_REASONING_LENGTH) {
    return NextResponse.json(
      { error: `Reasoning must be under ${MAX_REASONING_LENGTH.toLocaleString()} characters.` },
      { status: 400 }
    )
  }

  let parsedAnswer: unknown
  try {
    parsedAnswer = JSON.parse(answer)
  } catch {
    return NextResponse.json({ error: 'Answer must be valid JSON.' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()

  const { data: round, error: roundErr } = await service
    .from('rounds')
    .select('id, number, opens_at, closes_at')
    .eq('id', roundId)
    .maybeSingle<{ id: string; number: number; opens_at: string; closes_at: string }>()
  if (roundErr || !round) {
    return NextResponse.json({ error: 'Round not found.' }, { status: 404 })
  }
  const now = Date.now()
  if (new Date(round.opens_at).getTime() > now) {
    return NextResponse.json({ error: 'Round is not open yet.' }, { status: 400 })
  }
  if (new Date(round.closes_at).getTime() <= now) {
    return NextResponse.json({ error: 'Round is closed.' }, { status: 400 })
  }

  // Validate answer format for this round
  const validator = VALIDATORS[round.number]
  if (validator) {
    const validationError = validator(parsedAnswer)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
  }

  // Atomic attempt insert with count check via RPC to prevent race conditions.
  // Falls back to check-then-insert if the function doesn't exist yet.
  const { data: attemptResult, error: attemptErr } = await service.rpc(
    'insert_submission_attempt',
    { p_user_id: user.id, p_round_id: roundId, p_max_attempts: MAX_SUBMISSIONS_PER_ROUND }
  )

  if (attemptErr) {
    // Function may not exist — fall back to non-atomic check
    const { count, error: countErr } = await service
      .from('submission_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('round_id', roundId)
    if (countErr) {
      return NextResponse.json({ error: 'Rate limit lookup failed.' }, { status: 500 })
    }
    if ((count ?? 0) >= MAX_SUBMISSIONS_PER_ROUND) {
      return NextResponse.json(
        { error: `You have used all ${MAX_SUBMISSIONS_PER_ROUND} submissions for this round.` },
        { status: 429 }
      )
    }
    await service
      .from('submission_attempts')
      .insert({ user_id: user.id, round_id: roundId })
  } else if (attemptResult === false) {
    return NextResponse.json(
      { error: `You have used all ${MAX_SUBMISSIONS_PER_ROUND} submissions for this round.` },
      { status: 429 }
    )
  }

  const submittedAt = new Date().toISOString()
  const { error: upsertErr } = await service
    .from('submissions')
    .upsert(
      {
        user_id: user.id,
        round_id: roundId,
        answer: parsedAnswer,
        reasoning,
        submitted_at: submittedAt,
      },
      { onConflict: 'user_id,round_id' }
    )
  if (upsertErr) {
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, submittedAt })
}
