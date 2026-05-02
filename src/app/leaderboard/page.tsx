import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Leaderboard — Inference',
  description: 'Season rankings and per-round scores.',
}
import { PublicNav } from '@/components/PublicNav'
import { LeaderboardSearch } from '@/components/LeaderboardSearch'
import type { LeaderboardRow, Season, SeasonLeaderboardRow } from '@/types/database'

export const dynamic = 'force-dynamic'

function rankBorder(rank: number): string {
  if (rank === 1) return 'border-l-2 border-l-amber-400'
  if (rank === 2) return 'border-l-2 border-l-zinc-400'
  if (rank === 3) return 'border-l-2 border-l-amber-700'
  return 'border-l-2 border-l-transparent'
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; round?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createSupabaseServerClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('number', { ascending: false })
    .returns<Season[]>()

  if (!seasons || seasons.length === 0) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-sm text-zinc-400">
            Results will appear here after the first round closes.
          </p>
        </main>
      </div>
    )
  }

  const selectedSeasonNum = params.season ? parseInt(params.season) : seasons[0].number
  const selectedSeason = seasons.find((s) => s.number === selectedSeasonNum) ?? seasons[0]
  const selectedRound = params.round ? parseInt(params.round) : null
  const searchQuery = params.q?.toLowerCase()

  // Get rounds for this season (for the round picker)
  const { data: rounds } = await supabase
    .from('rounds')
    .select('number, title')
    .eq('season_id', selectedSeason.id)
    .order('number', { ascending: true })
    .returns<{ number: number; title: string }[]>()

  // Build tab links
  function tabUrl(opts: { season?: number; round?: number | null }) {
    const p = new URLSearchParams()
    p.set('season', String(opts.season ?? selectedSeasonNum))
    if (opts.round) p.set('round', String(opts.round))
    if (params.q) p.set('q', params.q)
    return `/leaderboard?${p.toString()}`
  }

  // Fetch data based on view
  let rows: { rank: number; display_name: string; user_id: string; score: number; raw?: number; rounds_played?: number }[] = []

  if (selectedRound) {
    // Per-round view
    const { data: roundRows } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('season_id', selectedSeason.id)
      .eq('round_number', selectedRound)
      .returns<LeaderboardRow[]>()

    rows = (roundRows ?? [])
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({
        rank: r.rank,
        display_name: r.display_name,
        user_id: '',
        score: r.score,
        raw: r.score, // per-round score IS the raw normalised score
      }))

    // Need raw_score from scores table for this round
    // The leaderboard view has normalised score. Get raw from scores directly.
    const { data: rawScores } = await supabase
      .from('scores')
      .select('user_id, raw_score, rank')
      .eq('round_id', (roundRows ?? [])[0]?.round_id ?? '')
      .returns<{ user_id: string; raw_score: number; rank: number }[]>()

    const rawMap = new Map(rawScores?.map((r) => [r.rank, { raw_score: r.raw_score, user_id: r.user_id }]) ?? [])

    rows = rows.map((r) => {
      const raw = rawMap.get(r.rank)
      return { ...r, raw: raw?.raw_score ?? 0, user_id: raw?.user_id ?? '' }
    })
  } else {
    // Season view
    const { data: seasonRows } = await supabase
      .from('season_leaderboard')
      .select('*')
      .eq('season_id', selectedSeason.id)
      .returns<SeasonLeaderboardRow[]>()

    rows = (seasonRows ?? [])
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({
        rank: r.rank,
        display_name: r.display_name,
        user_id: r.user_id,
        score: r.total_score,
        rounds_played: r.rounds_played,
      }))
  }

  // Filter by search
  if (searchQuery) {
    rows = rows.filter((r) =>
      r.display_name.toLowerCase().includes(searchQuery) ||
      r.user_id.toLowerCase().startsWith(searchQuery)
    )
  }

  // Sort by score desc, then alphabetically for ties
  rows.sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name))

  // Dense ranking — tied scores share rank, next gets rank+1
  if (rows.length > 0) {
    let denseRank = 1
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].score !== rows[i - 1].score) {
        denseRank++
      }
      rows[i].rank = denseRank
    }
  }

  const isRoundView = selectedRound !== null
  const roundTitle = rounds?.find((r) => r.number === selectedRound)?.title

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-zinc-100">Leaderboard</h1>

        {/* Season + Round tabs */}
        <div className="flex flex-col gap-3">
          {/* Season row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 w-14">Season</span>
            {seasons.map((s) => (
              <a
                key={s.id}
                href={tabUrl({ season: s.number, round: null })}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  s.number === selectedSeason.number
                    ? 'bg-amber-400 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-700'
                }`}
              >
                {s.name}
              </a>
            ))}
          </div>

          {/* Round row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 w-14">View</span>
            <a
              href={tabUrl({ round: null })}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !selectedRound
                  ? 'bg-amber-400 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-700'
              }`}
            >
              Overall
            </a>
            {(rounds ?? []).map((r) => (
              <a
                key={r.number}
                href={tabUrl({ round: r.number })}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedRound === r.number
                    ? 'bg-amber-400 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-700'
                }`}
              >
                R{r.number}
              </a>
            ))}
          </div>
        </div>

        {/* Search + info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {isRoundView
              ? `Round ${selectedRound} — ${roundTitle}`
              : `${selectedSeason.name} — combined scores`}
            {' · '}<a href="/about#scoring" className="text-amber-400 hover:text-amber-300">How scoring works</a>
          </p>
          <LeaderboardSearch />
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-6 text-center">
            <p className="text-sm text-zinc-400">
              {searchQuery
                ? `No results for "${params.q}".`
                : 'No scores yet. Scoring happens after each round closes.'}
            </p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                <tr>
                  <th className="text-right font-mono py-2 px-4 w-16">Rank</th>
                  <th className="text-left font-medium py-2 px-4">Participant</th>
                  {isRoundView && (
                    <th className="text-right font-mono py-2 px-4 w-28">Raw PnL</th>
                  )}
                  {!isRoundView && (
                    <th className="text-right font-mono py-2 px-4 w-20">Rounds</th>
                  )}
                  <th className="text-right font-mono py-2 px-4 w-28">
                    {isRoundView ? 'Points' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.user_id}-${i}`} className={`border-t border-zinc-800 ${rankBorder(row.rank)}`}>
                    <td className="text-right font-mono py-2 px-4 text-zinc-300">
                      {row.rank}
                    </td>
                    <td className="py-2 px-4">
                      {row.user_id ? (
                        <a href={`/profile/${row.user_id}`} className="text-zinc-100 hover:text-amber-400 transition-colors">
                          {row.display_name}
                        </a>
                      ) : (
                        <span className="text-zinc-100">{row.display_name}</span>
                      )}
                    </td>
                    {isRoundView && (
                      <td className="text-right font-mono py-2 px-4 text-zinc-400">
                        {row.raw != null ? row.raw.toFixed(2) : '—'}
                      </td>
                    )}
                    {!isRoundView && (
                      <td className="text-right font-mono py-2 px-4 text-zinc-500">
                        {row.rounds_played}/3
                      </td>
                    )}
                    <td className="text-right font-mono py-2 px-4 text-zinc-300">
                      {row.score.toFixed(isRoundView ? 1 : 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
