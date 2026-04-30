import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SAFE_NEXT_PATHS = new Set([
  '/dashboard',
  '/leaderboard',
  '/auth/reset-password',
])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const target = next && SAFE_NEXT_PATHS.has(next) ? next : '/dashboard'
  return NextResponse.redirect(new URL(target, request.url))
}
