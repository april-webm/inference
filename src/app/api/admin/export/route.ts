import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const ALLOWED_TABLES = ['submissions', 'scores', 'profiles'] as const
type AllowedTable = (typeof ALLOWED_TABLES)[number]

const COLUMNS: Record<AllowedTable, string[]> = {
  submissions: ['user_id', 'round_id', 'answer', 'reasoning', 'submitted_at'],
  scores: ['user_id', 'round_id', 'score', 'raw_score', 'rank', 'computed_at'],
  profiles: ['id', 'display_name', 'university_email', 'is_hidden', 'email_opt_out', 'created_at'],
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const table = url.searchParams.get('table') as AllowedTable | null
  const roundId = url.searchParams.get('round_id')

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json(
      { error: `table must be one of: ${ALLOWED_TABLES.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()
  const columns = COLUMNS[table]

  let query = supabase.from(table).select(columns.join(','))

  if (roundId && (table === 'submissions' || table === 'scores')) {
    query = query.eq('round_id', roundId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[]
  const headerRow = columns.join(',')
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeCSV(row[col])).join(',')
  )

  const csv = [headerRow, ...dataRows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${table}.csv"`,
    },
  })
}
