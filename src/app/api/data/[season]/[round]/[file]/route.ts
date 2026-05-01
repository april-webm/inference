import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import path from 'path'

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

  // Map filenames to actual files on disk
  const fileMap: Record<string, string> = {
    'race_data.csv': 'round-1.csv',
    'auction_history.csv': 'round-2.csv',
    'asset_history.csv': 'round-3.csv',
    'market_prices.json': 'round-3-market.json',
  }

  const diskFile = fileMap[file]
  if (!diskFile) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'round-data', `season-${season}`, diskFile)

  try {
    const data = await readFile(filePath)
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType(file),
        'Content-Disposition': `attachment; filename="${file}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
}
