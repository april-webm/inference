import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = createSupabaseServiceClient()

  const [
    { data: seasons },
    { data: profiles, count: profileCount },
    { data: latestSeason },
  ] = await Promise.all([
    supabase.from('seasons').select('*').order('number', { ascending: false }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('seasons').select('*').order('number', { ascending: false }).limit(1).single(),
  ])

  let rounds: Record<string, unknown>[] = []
  let submissionCounts: Record<string, number> = {}
  let scoreCounts: Record<string, number> = {}
  let downloadCounts: Record<string, number> = {}

  if (latestSeason) {
    const { data: roundData } = await supabase
      .from('rounds')
      .select('id, number, title, difficulty, opens_at, closes_at')
      .eq('season_id', latestSeason.id)
      .order('number')

    rounds = roundData ?? []

    const roundIds = rounds.map((r) => r.id as string)

    if (roundIds.length > 0) {
      const [{ data: subs }, { data: scores }, { data: downloads }] = await Promise.all([
        supabase
          .from('submissions')
          .select('round_id')
          .in('round_id', roundIds),
        supabase
          .from('scores')
          .select('round_id')
          .in('round_id', roundIds),
        supabase
          .from('downloads')
          .select('round_id')
          .in('round_id', roundIds),
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
    }
  }

  const now = Date.now()

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-medium text-zinc-100 mb-6">Overview</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Total users" value={profileCount ?? 0} />
        <Stat label="Seasons" value={seasons?.length ?? 0} />
        <Stat label="Current season" value={latestSeason?.name ?? '—'} />
      </div>

      {latestSeason && (
        <>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            {latestSeason.name} — Rounds
          </h2>
          <div className="border border-zinc-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Downloads</th>
                  <th className="px-4 py-2 font-medium text-right">Submissions</th>
                  <th className="px-4 py-2 font-medium text-right">Scored</th>
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

                  return (
                    <tr key={r.id as string} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-4 py-2 font-mono text-zinc-500">{r.number as number}</td>
                      <td className="px-4 py-2 text-zinc-100">{r.title as string}</td>
                      <td className={`px-4 py-2 ${statusColour}`}>{status}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {downloadCounts[r.id as string] ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {submissionCounts[r.id as string] ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {scoreCounts[r.id as string] ?? 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
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
