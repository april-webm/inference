import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateDisplayName } from '@/lib/moderation'
import { isAllowedEmailDomain } from '@/lib/email'

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; displayName?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  const { email, password, displayName } = body
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof displayName !== 'string'
  ) {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json(
      { error: 'Please use a university or major provider email (Gmail, Outlook, iCloud, Proton, etc.).' },
      { status: 400 },
    )
  }

  const nameCheck = validateDisplayName(displayName)
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.error }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const origin = new URL(request.url).origin
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: nameCheck.value },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
