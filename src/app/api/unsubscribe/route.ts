import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return new NextResponse('Missing email parameter.', { status: 400 })
  }

  const service = createSupabaseServiceClient()

  // Look up user by email
  const { data: users } = await service.auth.admin.listUsers({ perPage: 1, page: 1 })
  // Need to find by email — iterate
  let userId: string | null = null
  let page = 1
  while (!userId) {
    const { data } = await service.auth.admin.listUsers({ perPage: 1000, page })
    if (!data?.users || data.users.length === 0) break
    for (const u of data.users) {
      if (u.email === email) {
        userId = u.id
        break
      }
    }
    if (data.users.length < 1000) break
    page++
  }

  if (userId) {
    await service
      .from('profiles')
      .update({ email_opt_out: true })
      .eq('id', userId)
  }

  // Always show success (don't reveal if email exists)
  return new NextResponse(
    `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="background:#0a0a0a;color:#d4d4d8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
<div style="text-align:center;">
<h1 style="color:#fbbf24;font-family:monospace;font-size:24px;">Inference</h1>
<p>You have been unsubscribed from email notifications.</p>
<p style="color:#71717a;font-size:13px;margin-top:16px;">You can re-enable emails in <a href="/dashboard/settings" style="color:#fbbf24;">settings</a>.</p>
</div>
</body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
