import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  if (typeof body.writeup !== 'string') {
    return NextResponse.json(
      { error: 'writeup must be a string' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('rounds')
    .update({ writeup: body.writeup })
    .eq('id', id)
    .select('id, writeup')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Round not found.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
