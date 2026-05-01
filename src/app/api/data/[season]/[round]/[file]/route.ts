import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const ALLOWED_FILES: Record<string, Record<string, string[]>> = {
  '1': {
    '1': ['race_data.csv'],
    '2': ['auction_history.csv'],
    '3': ['asset_history.csv', 'market_prices.json'],
  },
}

function contentType(filename: string): string {
  if (filename.endsWith('.json')) return 'application/json'
  return 'text/csv'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string; round: string; file: string }> }
) {
  const { season, round, file } = await params

  const allowed = ALLOWED_FILES[season]?.[round]
  if (!allowed || !allowed.includes(file)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const service = createSupabaseServiceClient()

  // Check round is open
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
    .select('opens_at')
    .eq('season_id', seasonData.id)
    .eq('number', parseInt(round))
    .single<{ opens_at: string }>()

  if (!roundData) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (new Date(roundData.opens_at).getTime() > Date.now()) {
    return NextResponse.json({ error: 'Round is not open yet.' }, { status: 403 })
  }

  // Fetch from Supabase Storage
  const storagePath = `season-${season}/round-${round}/${file}`
  const { data, error } = await service.storage
    .from('round-data')
    .download(storagePath)

  if (error || !data) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType(file),
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
