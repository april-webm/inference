import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const body = await request.json()
  const { number, name, starts_at, ends_at } = body

  if (!number || !name || !starts_at || !ends_at) {
    return NextResponse.json(
      { error: 'Missing required fields: number, name, starts_at, ends_at.' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('seasons')
    .upsert({ number, name, starts_at, ends_at }, { onConflict: 'number' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
