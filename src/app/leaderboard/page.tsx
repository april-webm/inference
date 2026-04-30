import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import type { LeaderboardRow, Round } from '@/types/database'

export const dynamic = 'force-dynamic'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function rankBorder(rank: number): string {
  if (rank === 1) return 'border-l-2 border-l-amber-400'
  if (rank === 2) return 'border-l-2 border-l-zinc-400'
  if (rank === 3) return 'border-l-2 border-l-amber-700'
  return 'border-l-2 border-l-transparent'
}

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nowIso = new Date().toISOString()
  const { data: closedRounds } = await supabase
    .from('rounds')
    .select('*')
    .lt('closes_at', nowIso)
    .eq('is_active', false)
    .order('number', { ascending: false })
    .returns<Round[]>()

  const { data: rows } = await supabase
    .from('leaderboard')
    .select('*')
    .returns<LeaderboardRow[]>()

  const grouped = new Map<string, LeaderboardRow[]>()
  for (const row of rows ?? []) {
    const list = grouped.get(row.round_id) ?? []
    list.push(row)
    grouped.set(row.round_id, list)
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <a href="/" className="font-mono font-bold text-amber-400 tracking-tight">
          Inference
        </a>
        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <a href="/dashboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Dashboard
            </a>
          ) : (
            <a href="/auth/login" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Sign in
            </a>
          )}
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-12">
        {!closedRounds || closedRounds.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Results will appear here after the first round closes.
          </p>
        ) : (
          closedRounds.map((round) => {
            const roundRows = (grouped.get(round.id) ?? []).sort((a, b) => a.rank - b.rank)
            return (
              <section key={round.id} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-xs text-zinc-500">
                    Round {String(round.number).padStart(2, '0')}
                  </p>
                  <h2 className="text-lg font-medium text-zinc-100">{round.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <Badge variant={round.difficulty}>{round.difficulty}</Badge>
                    <span>Closed {formatDate(round.closes_at)}</span>
                  </div>
                </div>
                {roundRows.length === 0 ? (
                  <p className="text-sm text-zinc-500">No scored submissions.</p>
                ) : (
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
                        {roundRows.map((row) => (
                          <tr key={`${row.round_id}-${row.rank}`} className={`border-t border-zinc-800 ${rankBorder(row.rank)}`}>
                            <td className="text-right font-mono py-2 px-4 text-zinc-300">
                              {row.rank}
                            </td>
                            <td className="py-2 px-4 text-zinc-100">
                              {row.display_name}
                              {row.university_email && <span className="ml-2" title="University email">🎓</span>}
                            </td>
                            <td className="text-right font-mono py-2 px-4 text-zinc-300">
                              {row.score.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
