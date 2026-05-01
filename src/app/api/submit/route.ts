import { NextResponse } from 'next/server'
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from '@/lib/supabase/server'

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

  let parsedAnswer: unknown
  try {
    parsedAnswer = JSON.parse(answer)
  } catch {
    return NextResponse.json({ error: 'Answer must be valid JSON.' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()

  const { data: round, error: roundErr } = await service
    .from('rounds')
    .select('id, opens_at, closes_at')
    .eq('id', roundId)
    .maybeSingle<{ id: string; opens_at: string; closes_at: string }>()
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

  const { count: attemptCount, error: attemptErr } = await service
    .from('submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('round_id', roundId)
  if (attemptErr) {
    return NextResponse.json({ error: 'Rate limit lookup failed.' }, { status: 500 })
  }
  if ((attemptCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'You have used all 3 submissions for this round.' },
      { status: 429 }
    )
  }

  const { error: insertAttemptErr } = await service
    .from('submission_attempts')
    .insert({ user_id: user.id, round_id: roundId })
  if (insertAttemptErr) {
    return NextResponse.json({ error: 'Failed to log attempt.' }, { status: 500 })
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
