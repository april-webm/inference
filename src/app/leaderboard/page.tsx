import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PublicNav } from '@/components/PublicNav'
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
  searchParams: Promise<{ season?: string }>
}) {
  const params = await searchParams
  const supabase = await createSupabaseServerClient()

  // Fetch all seasons
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

  const selectedNumber = params.season ? parseInt(params.season) : seasons[0].number
  const selectedSeason = seasons.find((s) => s.number === selectedNumber) ?? seasons[0]

  // Combined season leaderboard
  const { data: seasonRows } = await supabase
    .from('season_leaderboard')
    .select('*')
    .eq('season_id', selectedSeason.id)
    .returns<SeasonLeaderboardRow[]>()

  // Per-round breakdown
  const { data: roundRows } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('season_id', selectedSeason.id)
    .returns<LeaderboardRow[]>()

  const sortedSeasonRows = (seasonRows ?? []).sort((a, b) => a.rank - b.rank)

  // Group round rows by round_number
  const roundGroups = new Map<number, { title: string; difficulty: string; rows: LeaderboardRow[] }>()
  for (const row of roundRows ?? []) {
    const existing = roundGroups.get(row.round_number)
    if (existing) {
      existing.rows.push(row)
    } else {
      roundGroups.set(row.round_number, {
        title: row.round_title,
        difficulty: row.difficulty,
        rows: [row],
      })
    }
  }
  const sortedRoundNumbers = [...roundGroups.keys()].sort((a, b) => a - b)

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-zinc-100">Leaderboard</h1>
          {seasons.length > 1 && (
            <div className="flex items-center gap-2">
              {seasons.map((s) => (
                <a
                  key={s.id}
                  href={`/leaderboard?season=${s.number}`}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    s.number === selectedSeason.number
                      ? 'bg-amber-400 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-700'
                  }`}
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          {selectedSeason.name} — combined scores across all rounds.
          {' '}<a href="/about#scoring" className="text-amber-400 hover:text-amber-300">How scoring works</a>
        </p>

        {sortedSeasonRows.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No scored rounds yet for {selectedSeason.name}.
          </p>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                <tr>
                  <th className="text-right font-mono py-2 px-4 w-16">Rank</th>
                  <th className="text-left font-medium py-2 px-4">Participant</th>
                  <th className="text-right font-mono py-2 px-4 w-20">Rounds</th>
                  <th className="text-right font-mono py-2 px-4 w-32">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedSeasonRows.map((row) => (
                  <tr key={row.user_id} className={`border-t border-zinc-800 ${rankBorder(row.rank)}`}>
                    <td className="text-right font-mono py-2 px-4 text-zinc-300">
                      {row.rank}
                    </td>
                    <td className="py-2 px-4 text-zinc-100">
                      {row.display_name}
                    </td>
                    <td className="text-right font-mono py-2 px-4 text-zinc-500">
                      {row.rounds_played}/3
                    </td>
                    <td className="text-right font-mono py-2 px-4 text-zinc-300">
                      {row.total_score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedRoundNumbers.length > 0 && (
          <>
            <hr className="border-zinc-800" />
            <h2 className="text-lg font-medium text-zinc-100">Per-Round Breakdown</h2>
            {sortedRoundNumbers.map((num) => {
              const group = roundGroups.get(num)!
              const sorted = group.rows.sort((a, b) => a.rank - b.rank)
              return (
                <section key={num} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-xs text-zinc-500">Round {String(num).padStart(2, '0')}</p>
                    <span className="text-sm text-zinc-300">{group.title}</span>
                    <Badge variant={group.difficulty as 'chill' | 'medium' | 'hard'}>{group.difficulty}</Badge>
                  </div>
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                        <tr>
                          <th className="text-right font-mono py-2 px-4 w-16">Rank</th>
                          <th className="text-left font-medium py-2 px-4">Participant</th>
                          <th className="text-right font-mono py-2 px-4 w-32">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((row) => (
                          <tr key={`${row.round_id}-${row.rank}`} className={`border-t border-zinc-800 ${rankBorder(row.rank)}`}>
                            <td className="text-right font-mono py-2 px-4 text-zinc-300">
                              {row.rank}
                            </td>
                            <td className="py-2 px-4 text-zinc-100">
                              {row.display_name}
                            </td>
                            <td className="text-right font-mono py-2 px-4 text-zinc-300">
                              {row.score.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </>
        )}
      </main>
    </div>
  )
}
