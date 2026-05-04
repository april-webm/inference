import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const BUCKET = 'round-data'

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const formData = await request.formData()
  const season = formData.get('season')
  const round = formData.get('round')
  const file = formData.get('file') as File | null

  if (!season || !round || !file) {
    return NextResponse.json(
      { error: 'Missing required fields: season, round, file.' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  // Ensure bucket exists (ignore error if it already does)
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const path = `season-${season}/round-${round}/${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'text/csv',
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: urlData.publicUrl, path })
}
