import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const roundId = searchParams.get('round_id')

  const supabase = createSupabaseServiceClient()

  let query = supabase
    .from('submissions')
    .select('*, rounds(*)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  if (roundId) {
    query = query.eq('round_id', roundId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
