import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  if (typeof body.is_hidden !== 'boolean') {
    return NextResponse.json(
      { error: 'is_hidden must be a boolean.' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_hidden: body.is_hidden })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
