import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const VALID_DIFFICULTIES = ['chill', 'medium', 'hard'] as const

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const body = await request.json()
  const { season_id, number, title, tagline, description, difficulty, opens_at, closes_at } = body

  if (!season_id || !number || !title || !difficulty || !opens_at || !closes_at) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    )
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json(
      { error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const roundData = { season_id, number, title, tagline, description, difficulty, opens_at, closes_at }

  // Check if round with this season_id + number already exists
  const { data: existing } = await supabase
    .from('rounds')
    .select('id')
    .eq('season_id', season_id)
    .eq('number', number)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('rounds')
      .update(roundData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('rounds')
    .insert(roundData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
