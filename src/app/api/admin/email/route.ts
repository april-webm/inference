import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return NextResponse.json({ error: 'Email not configured.' }, { status: 500 })
  }

  const { subject, body, testEmail } = await request.json()
  if (!subject || !body) {
    return NextResponse.json({ error: 'Subject and body required.' }, { status: 400 })
  }

  const resend = new Resend(apiKey)

  // Test mode: send to single address
  if (testEmail) {
    const { error } = await resend.emails.send({
      from,
      to: testEmail,
      subject,
      html: body,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ count: 1 })
  }

  // Production: send to all opted-in, confirmed users
  const supabase = createSupabaseServiceClient()

  // Get opted-out user IDs
  const { data: optedOut } = await supabase
    .from('profiles')
    .select('id')
    .eq('email_opt_out', true)

  const optedOutIds = new Set((optedOut ?? []).map((p) => p.id))

  // Paginate auth users, filter confirmed + not opted out
  const eligibleEmails: string[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error || !users || users.length === 0) break

    for (const user of users) {
      if (!user.email || !user.email_confirmed_at) continue
      if (optedOutIds.has(user.id)) continue
      eligibleEmails.push(user.email)
    }

    if (users.length < perPage) break
    page++
  }

  let sent = 0
  const errors: string[] = []

  for (const email of eligibleEmails) {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html: body,
    })
    if (error) {
      errors.push(`${email}: ${error.message}`)
    } else {
      sent++
    }
    // Rate limit: 150ms between sends
    await new Promise((r) => setTimeout(r, 150))
  }

  return NextResponse.json({
    count: sent,
    total: eligibleEmails.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
