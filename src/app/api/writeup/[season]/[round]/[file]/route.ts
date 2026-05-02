import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string; round: string; file: string }> }
) {
  const { season, round, file } = await params

  // Only serve images
  if (!file.endsWith('.png') && !file.endsWith('.jpg')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const service = createSupabaseServiceClient()

  // Check round is closed (writeup only visible after close)
  const { data: seasonData } = await service
    .from('seasons')
    .select('id')
    .eq('number', parseInt(season))
    .single<{ id: string }>()

  if (!seasonData) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const { data: roundData } = await service
    .from('rounds')
    .select('closes_at')
    .eq('season_id', seasonData.id)
    .eq('number', parseInt(round))
    .single<{ closes_at: string }>()

  if (!roundData || new Date(roundData.closes_at).getTime() > Date.now()) {
    return NextResponse.json({ error: 'Not available yet.' }, { status: 403 })
  }

  // Fetch from Supabase Storage
  const storagePath = `season-${season}/round-${round}/writeup/${file}`
  const { data, error } = await service.storage
    .from('round-data')
    .download(storagePath)

  if (error || !data) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': file.endsWith('.png') ? 'image/png' : 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
