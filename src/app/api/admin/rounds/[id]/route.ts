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

  if (body.difficulty && !['chill', 'medium', 'hard'].includes(body.difficulty)) {
    return NextResponse.json(
      { error: 'difficulty must be one of: chill, medium, hard' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('rounds')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Round not found.' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createSupabaseServiceClient()

  // Check for existing submissions before allowing deletion
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('round_id', id)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete round with ${count} existing submission(s).` },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('rounds')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
