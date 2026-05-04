import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createSupabaseServiceClient()

  // Fetch round to get date range
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .select('opens_at, closes_at')
    .eq('id', id)
    .single()

  if (roundError || !round) {
    return NextResponse.json({ error: 'Round not found.' }, { status: 404 })
  }

  // All queries in parallel
  const [
    submissionCountRes,
    downloadersRes,
    attemptsRes,
    submissionsRes,
  ] = await Promise.all([
    // Total submissions
    supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', id),

    // Unique downloaders
    supabase
      .from('downloads')
      .select('user_id')
      .eq('round_id', id),

    // All attempts per user for resubmission stats
    supabase
      .from('submission_attempts')
      .select('user_id')
      .eq('round_id', id),

    // Submissions with reasoning + submitted_at for timeline and reasoning stats
    supabase
      .from('submissions')
      .select('reasoning, submitted_at')
      .eq('round_id', id),
  ])

  const submissionCount = submissionCountRes.count ?? 0

  // Unique downloaders
  const downloaderIds = new Set(
    (downloadersRes.data ?? []).map((d) => d.user_id)
  )
  const uniqueDownloaders = downloaderIds.size

  // Resubmission stats: count attempts per user
  const attemptsByUser = new Map<string, number>()
  for (const a of attemptsRes.data ?? []) {
    attemptsByUser.set(a.user_id, (attemptsByUser.get(a.user_id) ?? 0) + 1)
  }
  const userCounts = [...attemptsByUser.values()]
  const resubmitters = userCounts.filter((c) => c > 1).length
  const avgUpdates =
    userCounts.length > 0
      ? userCounts.reduce((s, v) => s + v, 0) / userCounts.length
      : 0

  // Reasoning stats (character length)
  const reasoningLengths = (submissionsRes.data ?? [])
    .map((s) => (s.reasoning ?? '').length)
    .filter((len) => len > 0)

  const reasoningStats =
    reasoningLengths.length > 0
      ? {
          min: Math.min(...reasoningLengths),
          avg: Math.round(
            reasoningLengths.reduce((s, v) => s + v, 0) /
              reasoningLengths.length
          ),
          max: Math.max(...reasoningLengths),
        }
      : { min: 0, avg: 0, max: 0 }

  // Timeline buckets: submissions per day between opens_at and closes_at
  const opensDate = new Date(round.opens_at)
  const closesDate = new Date(round.closes_at)
  const bucketMap = new Map<string, number>()

  // Pre-fill all days in range
  const cursor = new Date(opensDate)
  cursor.setUTCHours(0, 0, 0, 0)
  const end = new Date(closesDate)
  end.setUTCHours(0, 0, 0, 0)
  while (cursor <= end) {
    bucketMap.set(cursor.toISOString().slice(0, 10), 0)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  for (const s of submissionsRes.data ?? []) {
    const day = new Date(s.submitted_at).toISOString().slice(0, 10)
    bucketMap.set(day, (bucketMap.get(day) ?? 0) + 1)
  }

  const timelineBuckets = [...bucketMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    submissionCount,
    uniqueDownloaders,
    resubmitters,
    avgUpdates: Math.round(avgUpdates * 100) / 100,
    reasoningStats,
    timelineBuckets,
  })
}
