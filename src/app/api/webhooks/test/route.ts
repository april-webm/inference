import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Rate limit: 1 test per user per 60 seconds
const lastTest = new Map<string, number>()
const COOLDOWN_MS = 60_000

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Rate limit per user
  const now = Date.now()
  const last = lastTest.get(user.id)
  if (last && now - last < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return NextResponse.json(
      { error: `Wait ${wait}s before testing again.` },
      { status: 429 }
    )
  }

  const { webhookId } = await request.json()
  if (!webhookId) {
    return NextResponse.json({ error: 'Missing webhookId.' }, { status: 400 })
  }

  // Verify ownership
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('id, url, user_id')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 })
  }

  // Record this test
  lastTest.set(user.id, now)

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'Inference — Test Notification',
          description: 'Your webhook is working. You\'ll receive notifications here for the events you subscribed to.',
          color: 0x6366f1,
          timestamp: new Date().toISOString(),
        }],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `Webhook returned ${res.status}: ${text.slice(0, 100)}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach URL: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 400 }
    )
  }
}
