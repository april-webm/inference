import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const VALID_EVENTS = [
  'season_open',
  'round_open',
  'round_24h_warning',
  'round_close',
  'scores_posted',
]

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('webhooks')
    .select('id, url, events, enabled, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch webhooks.' }, { status: 500 })
  }

  return NextResponse.json({ webhooks: data })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { url?: unknown; events?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const { url, events } = body
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL must be a valid HTTPS URL.' }, { status: 400 })
  }

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'At least one event is required.' }, { status: 400 })
  }

  for (const ev of events) {
    if (!VALID_EVENTS.includes(ev)) {
      return NextResponse.json({ error: `Invalid event: ${ev}` }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('webhooks')
    .insert({ user_id: user.id, url, events })
    .select('id, url, events, enabled, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create webhook.' }, { status: 500 })
  }

  return NextResponse.json({ webhook: data }, { status: 201 })
}
