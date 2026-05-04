import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { ExportButtons } from './ExportButtons'

export const dynamic = 'force-dynamic'

export default async function AdminScoresPage() {
  const supabase = createSupabaseServiceClient()

  const { data: latestSeason } = await supabase
    .from('seasons')
    .select('*')
    .order('number', { ascending: false })
    .limit(1)
    .single()

  let rounds: { id: string; number: number; title: string; closes_at: string }[] = []
  let scoreCounts: Record<string, number> = {}
  let submissionCounts: Record<string, number> = {}

  if (latestSeason) {
    const { data } = await supabase
      .from('rounds')
      .select('id, number, title, closes_at')
      .eq('season_id', latestSeason.id)
      .order('number')

    rounds = data ?? []
    const roundIds = rounds.map((r) => r.id)

    if (roundIds.length > 0) {
      const [{ data: scores }, { data: subs }] = await Promise.all([
        supabase.from('scores').select('round_id').in('round_id', roundIds),
        supabase.from('submissions').select('round_id').in('round_id', roundIds),
      ])

      for (const s of scores ?? []) {
        scoreCounts[s.round_id] = (scoreCounts[s.round_id] || 0) + 1
      }
      for (const s of subs ?? []) {
        submissionCounts[s.round_id] = (submissionCounts[s.round_id] || 0) + 1
      }
    }
  }

  const now = Date.now()

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-medium text-zinc-100 mb-6">Scores</h1>

      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="px-4 py-2 font-medium">Round</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Submissions</th>
              <th className="px-4 py-2 font-medium text-right">Scored</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => {
              const closed = new Date(r.closes_at).getTime() < now
              const scored = (scoreCounts[r.id] ?? 0) > 0

              return (
                <tr key={r.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-2 text-zinc-100">
                    #{r.number} — {r.title}
                  </td>
                  <td className="px-4 py-2">
                    {scored ? (
                      <span className="text-emerald-400">scored</span>
                    ) : closed ? (
                      <span className="text-amber-400">awaiting scoring</span>
                    ) : (
                      <span className="text-zinc-500">open</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {submissionCounts[r.id] ?? 0}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {scoreCounts[r.id] ?? 0}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {closed && !scored && (
                      <span className="text-xs text-zinc-500">
                        Trigger via GitHub Actions
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ExportButtons rounds={rounds} />

      <p className="text-xs text-zinc-600 mt-4">
        Scoring is triggered via GitHub Actions workflow dispatch. Use the Emails page for notifications.
      </p>
    </div>
  )
}
