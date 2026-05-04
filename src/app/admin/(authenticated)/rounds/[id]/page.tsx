import { redirect } from 'next/navigation'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { WriteupEditor } from './WriteupEditor'

export const dynamic = 'force-dynamic'

export default async function AdminRoundWriteupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await verifyAdminSession())) {
    redirect('/admin/login')
  }

  const { id } = await params
  const supabase = createSupabaseServiceClient()

  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .select('id, number, title, writeup, closes_at')
    .eq('id', id)
    .single()

  if (roundError || !round) {
    redirect('/admin/rounds')
  }

  const isClosed = new Date(round.closes_at).getTime() < Date.now()

  // Get top 5 submissions by score
  const { data: topScores } = await supabase
    .from('scores')
    .select('user_id, score, raw_score, rank')
    .eq('round_id', id)
    .order('rank', { ascending: true })
    .limit(5)

  type TopEntry = {
    rank: number
    score: number
    reasoning: string | null
  }

  const topEntries: TopEntry[] = []

  if (topScores && topScores.length > 0) {
    for (const s of topScores) {
      const { data: submission } = await supabase
        .from('submissions')
        .select('reasoning')
        .eq('user_id', s.user_id)
        .eq('round_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      topEntries.push({
        rank: s.rank,
        score: s.score,
        reasoning: submission?.reasoning ?? null,
      })
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <a
          href="/admin/rounds"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to rounds
        </a>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-medium text-zinc-100">
          Round #{round.number} — {round.title}
        </h1>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            isClosed
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-emerald-900/50 text-emerald-400'
          }`}
        >
          {isClosed ? 'Closed' : 'Open'}
        </span>
      </div>

      {topEntries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Top reasonings</h2>
          <div className="space-y-3">
            {topEntries.map((entry) => (
              <div
                key={entry.rank}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-amber-400">
                    Rank #{entry.rank}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Score: {entry.score.toFixed(2)}
                  </span>
                </div>
                {entry.reasoning ? (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {entry.reasoning}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 italic">No reasoning provided</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Writeup editor</h2>
        <WriteupEditor roundId={round.id} initialWriteup={round.writeup} />
      </section>
    </div>
  )
}
