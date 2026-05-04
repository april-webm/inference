import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const VALID_EVENTS = [
  'season_open',
  'round_open',
  'round_24h_warning',
  'round_close',
  'scores_posted',
]

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('webhooks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 })
  }

  let body: { url?: unknown; events?: unknown; enabled?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.url !== undefined) {
    if (typeof body.url !== 'string' || !body.url.startsWith('https://')) {
      return NextResponse.json({ error: 'URL must be a valid HTTPS URL.' }, { status: 400 })
    }
    updates.url = body.url
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'At least one event is required.' }, { status: 400 })
    }
    for (const ev of body.events) {
      if (!VALID_EVENTS.includes(ev)) {
        return NextResponse.json({ error: `Invalid event: ${ev}` }, { status: 400 })
      }
    }
    updates.events = body.events
  }

  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean.' }, { status: 400 })
    }
    updates.enabled = body.enabled
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, url, events, enabled, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update webhook.' }, { status: 500 })
  }

  return NextResponse.json({ webhook: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete webhook.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
