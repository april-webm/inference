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
  const { name, starts_at, ends_at } = body

  if (!name && !starts_at && !ends_at) {
    return NextResponse.json(
      { error: 'Provide at least one field to update: name, starts_at, ends_at.' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (starts_at !== undefined) updates.starts_at = starts_at
  if (ends_at !== undefined) updates.ends_at = ends_at

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('seasons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Season not found.' }, { status: 404 })
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

  // Check for existing rounds before allowing deletion
  const { count, error: countError } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', id)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete season with ${count} existing round(s). Delete the rounds first.` },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
