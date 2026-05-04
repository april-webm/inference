import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { countryFlag } from '@/lib/countries'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = createSupabaseServiceClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: seasons },
    { count: profileCount },
    { data: latestSeason },
    { data: allProfiles },
    { count: totalSubmissions },
    { data: recentSignups },
    { data: activeUserRows },
    { data: optOutRows },
  ] = await Promise.all([
    supabase.from('seasons').select('*').order('number', { ascending: false }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('seasons').select('*').order('number', { ascending: false }).limit(1).single(),
    supabase.from('profiles').select('id, university_email, country_code, email_opt_out, created_at'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, created_at').gte('created_at', sevenDaysAgo),
    supabase.from('submissions').select('user_id'),
    supabase.from('profiles').select('id').eq('email_opt_out', true),
  ])

  const totalUsers = profileCount ?? 0
  const activeUserIds = new Set((activeUserRows ?? []).map((r) => r.user_id))
  const activeUsers = activeUserIds.size
  const signupsLast7 = recentSignups?.length ?? 0
  const totalSubs = totalSubmissions ?? 0
  const optOutRate = totalUsers > 0 ? ((optOutRows?.length ?? 0) / totalUsers * 100).toFixed(1) : '0'

  // Signup trend: group by day for last 7 days
  const signupsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    signupsByDay[key] = 0
  }
  for (const p of recentSignups ?? []) {
    const key = new Date(p.created_at).toISOString().slice(0, 10)
    if (key in signupsByDay) signupsByDay[key]++
  }
  const signupDays = Object.entries(signupsByDay)
  const maxSignups = Math.max(...signupDays.map(([, v]) => v), 1)

  // Demographics
  const universityUsers = (allProfiles ?? []).filter((p) => p.university_email).length
  const nonUniversityUsers = totalUsers - universityUsers
  const countryDist: Record<string, number> = {}
  for (const p of allProfiles ?? []) {
    if (p.country_code) {
      countryDist[p.country_code] = (countryDist[p.country_code] || 0) + 1
    }
  }
  const topCountries = Object.entries(countryDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const neverSubmitted = totalUsers - activeUsers

  // Per-round data
  let rounds: Record<string, unknown>[] = []
  let submissionCounts: Record<string, number> = {}
  let scoreCounts: Record<string, number> = {}
  let downloadCounts: Record<string, number> = {}
  let resubmissionCounts: Record<string, number> = {}
  let avgReasoningLengths: Record<string, number> = {}
  let timelineStats: Record<string, { first24Pct: number; last24Pct: number }> = {}

  // Conversion funnel data
  let funnelDownloaders = 0
  let funnelSubmitters = 0

  if (latestSeason) {
    const { data: roundData } = await supabase
      .from('rounds')
      .select('id, number, title, difficulty, opens_at, closes_at')
      .eq('season_id', latestSeason.id)
      .order('number')

    rounds = roundData ?? []
    const roundIds = rounds.map((r) => r.id as string)

    if (roundIds.length > 0) {
      const [
        { data: subs },
        { data: scores },
        { data: downloads },
        { data: attempts },
        { data: submissions },
      ] = await Promise.all([
        supabase.from('submissions').select('round_id, user_id').in('round_id', roundIds),
        supabase.from('scores').select('round_id').in('round_id', roundIds),
        supabase.from('downloads').select('round_id, user_id').in('round_id', roundIds),
        supabase.from('submission_attempts').select('user_id, round_id, attempted_at').in('round_id', roundIds),
        supabase.from('submissions').select('round_id, reasoning').in('round_id', roundIds),
      ])

      for (const s of subs ?? []) {
        submissionCounts[s.round_id] = (submissionCounts[s.round_id] || 0) + 1
      }
      for (const s of scores ?? []) {
        scoreCounts[s.round_id] = (scoreCounts[s.round_id] || 0) + 1
      }
      for (const d of downloads ?? []) {
        downloadCounts[d.round_id] = (downloadCounts[d.round_id] || 0) + 1
      }

      // Resubmissions: users with >1 attempt per round
      const attemptsByRoundUser: Record<string, Record<string, number>> = {}
      for (const a of attempts ?? []) {
        if (!attemptsByRoundUser[a.round_id]) attemptsByRoundUser[a.round_id] = {}
        attemptsByRoundUser[a.round_id][a.user_id] = (attemptsByRoundUser[a.round_id][a.user_id] || 0) + 1
      }
      for (const [roundId, users] of Object.entries(attemptsByRoundUser)) {
        resubmissionCounts[roundId] = Object.values(users).filter((c) => c > 1).length
      }

      // Avg reasoning length
      const reasoningByRound: Record<string, number[]> = {}
      for (const s of submissions ?? []) {
        if (!reasoningByRound[s.round_id]) reasoningByRound[s.round_id] = []
        reasoningByRound[s.round_id].push(s.reasoning ? s.reasoning.length : 0)
      }
      for (const [roundId, lengths] of Object.entries(reasoningByRound)) {
        avgReasoningLengths[roundId] = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      }

      // Timeline stats: % submitted in first 24h and last 24h
      const roundMap = new Map(rounds.map((r) => [r.id as string, r]))
      for (const roundId of roundIds) {
        const round = roundMap.get(roundId)
        if (!round) continue
        const opens = new Date(round.opens_at as string).getTime()
        const closes = new Date(round.closes_at as string).getTime()
        const first24Cutoff = opens + 24 * 60 * 60 * 1000
        const last24Cutoff = closes - 24 * 60 * 60 * 1000

        // Get first attempt per user for this round
        const firstAttempts: Record<string, number> = {}
        for (const a of (attempts ?? []).filter((a) => a.round_id === roundId)) {
          const t = new Date(a.attempted_at).getTime()
          if (!firstAttempts[a.user_id] || t < firstAttempts[a.user_id]) {
            firstAttempts[a.user_id] = t
          }
        }
        const allFirst = Object.values(firstAttempts)
        const total = allFirst.length
        if (total > 0) {
          const inFirst24 = allFirst.filter((t) => t <= first24Cutoff).length
          const inLast24 = allFirst.filter((t) => t >= last24Cutoff).length
          timelineStats[roundId] = {
            first24Pct: Math.round((inFirst24 / total) * 100),
            last24Pct: Math.round((inLast24 / total) * 100),
          }
        }
      }

      // Conversion funnel
      const downloadUserIds = new Set((downloads ?? []).map((d) => d.user_id))
      const subUserIds = new Set((subs ?? []).map((s) => s.user_id))
      funnelDownloaders = downloadUserIds.size
      funnelSubmitters = subUserIds.size
    }
  }

  const now = Date.now()

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-medium text-zinc-100 mb-6">Overview</h1>

      {/* Top-level stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Stat label="Total users" value={totalUsers} />
        <Stat label="Active users" value={activeUsers} />
        <Stat label="Signups (7d)" value={signupsLast7} />
        <Stat label="Total submissions" value={totalSubs} />
        <Stat label="Email opt-out" value={`${optOutRate}%`} />
      </div>

      {/* Signup trend */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Signups — last 7 days</h2>
        <div className="border border-zinc-800 rounded p-4 space-y-2">
          {signupDays.map(([day, count]) => {
            const label = new Date(day + 'T00:00:00').toLocaleDateString('en-AU', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
            const width = Math.max((count / maxSignups) * 100, 2)
            return (
              <div key={day} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-zinc-500 shrink-0">{label}</span>
                <div className="flex-1 h-5 relative">
                  <div
                    className="h-full bg-amber-400/80 rounded-sm"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-zinc-300">{count}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Per-round detail table */}
      {latestSeason && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            {latestSeason.name} — Rounds
          </h2>
          <div className="border border-zinc-800 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">DL</th>
                  <th className="px-3 py-2 font-medium text-right">Subs</th>
                  <th className="px-3 py-2 font-medium text-right">Resubs</th>
                  <th className="px-3 py-2 font-medium text-right">Scored</th>
                  <th className="px-3 py-2 font-medium text-right">Avg reason</th>
                  <th className="px-3 py-2 font-medium">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => {
                  const opens = new Date(r.opens_at as string).getTime()
                  const closes = new Date(r.closes_at as string).getTime()
                  const status = now < opens ? 'upcoming' : now < closes ? 'open' : 'closed'
                  const statusColour = {
                    upcoming: 'text-zinc-500',
                    open: 'text-emerald-400',
                    closed: 'text-zinc-400',
                  }[status]
                  const rid = r.id as string
                  const tl = timelineStats[rid]

                  return (
                    <tr key={rid} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-3 py-2 font-mono text-zinc-500">{r.number as number}</td>
                      <td className="px-3 py-2 text-zinc-100">{r.title as string}</td>
                      <td className={`px-3 py-2 ${statusColour}`}>{status}</td>
                      <td className="px-3 py-2 text-right font-mono">{downloadCounts[rid] ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{submissionCounts[rid] ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{resubmissionCounts[rid] ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{scoreCounts[rid] ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {avgReasoningLengths[rid] != null ? `${avgReasoningLengths[rid]} ch` : '—'}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 text-xs whitespace-nowrap">
                        {tl ? `${tl.first24Pct}% first 24h, ${tl.last24Pct}% last 24h` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* User demographics */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">User demographics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-zinc-800 rounded p-4">
            <p className="text-xs text-zinc-500 mb-2">University affiliation</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-300">University email</span>
                <span className="font-mono text-zinc-100">
                  {universityUsers} ({totalUsers > 0 ? ((universityUsers / totalUsers) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Non-university</span>
                <span className="font-mono text-zinc-100">
                  {nonUniversityUsers} ({totalUsers > 0 ? ((nonUniversityUsers / totalUsers) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 rounded p-4">
            <p className="text-xs text-zinc-500 mb-2">Activity breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-300">Active (submitted)</span>
                <span className="font-mono text-zinc-100">{activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Never submitted</span>
                <span className="font-mono text-zinc-100">{neverSubmitted}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded p-4 mt-4">
          <p className="text-xs text-zinc-500 mb-2">Top 10 countries</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {topCountries.map(([code, count]) => (
              <div key={code} className="flex justify-between">
                <span className="text-zinc-300">
                  {countryFlag(code)} {code}
                </span>
                <span className="font-mono text-zinc-100">{count}</span>
              </div>
            ))}
            {topCountries.length === 0 && (
              <p className="text-zinc-500">No country data</p>
            )}
          </div>
        </div>
      </section>

      {/* Conversion funnel */}
      {latestSeason && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            Conversion funnel — {latestSeason.name}
          </h2>
          <div className="border border-zinc-800 rounded p-4 space-y-3">
            <FunnelRow label="Signups" value={totalUsers} max={totalUsers} />
            <FunnelRow label="Downloaded data" value={funnelDownloaders} max={totalUsers} />
            <FunnelRow label="Submitted" value={funnelSubmitters} max={totalUsers} />
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-zinc-800 rounded p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-lg font-medium text-zinc-100">{value}</p>
    </div>
  )
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? ((value / max) * 100).toFixed(1) : '0'
  const width = max > 0 ? Math.max((value / max) * 100, 3) : 3
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-zinc-300 shrink-0">{label}</span>
      <div className="flex-1 h-6 relative">
        <div
          className="h-full bg-amber-400/60 rounded-sm flex items-center px-2"
          style={{ width: `${width}%` }}
        >
          <span className="text-xs font-mono text-zinc-900 whitespace-nowrap">
            {value} ({pct}%)
          </span>
        </div>
      </div>
    </div>
  )
}
