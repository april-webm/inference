import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard — Inference',
  description: 'Your profile, submissions, and scores.',
}
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/Countdown'
import { ShareProfileButton } from '@/components/ShareProfileButton'
import type { Round, Season, Submission, Score, Profile } from '@/types/database'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Parallel: profile + season (independent)
  const [{ data: profile }, { data: seasons }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, university_email, created_at')
      .eq('id', user!.id)
      .single<Pick<Profile, 'display_name' | 'university_email' | 'created_at'>>(),
    supabase
      .from('seasons')
      .select('id, number, name')
      .order('number', { ascending: false })
      .limit(1)
      .returns<Pick<Season, 'id' | 'number' | 'name'>[]>(),
  ])

  const currentSeason = seasons?.[0]

  // Rounds for current season
  const { data: rounds } = currentSeason
    ? await supabase
        .from('rounds')
        .select('id, number, title, tagline, difficulty, opens_at, closes_at')
        .eq('season_id', currentSeason.id)
        .order('number', { ascending: true })
        .returns<Omit<Round, 'description' | 'season_id' | 'is_active' | 'created_at'>[]>()
    : { data: [] }

  // User submissions + scores
  const roundIds = (rounds ?? []).map((r) => r.id)
  const { data: submissions } = roundIds.length > 0
    ? await supabase
        .from('submissions')
        .select('round_id, answer, submitted_at')
        .eq('user_id', user!.id)
        .in('round_id', roundIds)
        .returns<Pick<Submission, 'round_id' | 'answer' | 'submitted_at'>[]>()
    : { data: [] }

  const { data: scores } = roundIds.length > 0
    ? await supabase
        .from('scores')
        .select('round_id, score, raw_score, rank')
        .eq('user_id', user!.id)
        .in('round_id', roundIds)
        .returns<Pick<Score, 'round_id' | 'score' | 'raw_score' | 'rank'>[]>()
    : { data: [] }

  // Attempts remaining for active round
  const activeRound = (rounds ?? []).find((r) => {
    const opens = new Date(r.opens_at).getTime()
    const closes = new Date(r.closes_at).getTime()
    const now = Date.now()
    return opens <= now && closes > now
  })

  let attemptsRemaining = 3
  if (activeRound) {
    const { count } = await supabase
      .from('submission_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('round_id', activeRound.id)
      .eq('user_id', user!.id)
    attemptsRemaining = Math.max(0, 3 - (count ?? 0))
  }

  // Season rank
  const { data: seasonRank } = currentSeason
    ? await supabase
        .from('season_leaderboard')
        .select('rank, total_score')
        .eq('season_id', currentSeason.id)
        .eq('user_id', user!.id)
        .maybeSingle<{ rank: number; total_score: number }>()
    : { data: null }

  const subsByRound = new Map(submissions?.map((s) => [s.round_id, s]) ?? [])
  const scoresByRound = new Map(scores?.map((s) => [s.round_id, s]) ?? [])
  const seasonTotal = scores?.reduce((sum, s) => sum + s.score, 0) ?? 0

  // Badges
  const badges: { label: string; color: string; season: string }[] = []
  if (seasonRank) {
    const sName = currentSeason?.name ?? ''
    if (seasonRank.rank === 1) badges.push({ label: '1st', color: 'border-amber-400 text-amber-400', season: sName })
    else if (seasonRank.rank === 2) badges.push({ label: '2nd', color: 'border-zinc-400 text-zinc-400', season: sName })
    else if (seasonRank.rank === 3) badges.push({ label: '3rd', color: 'border-amber-700 text-amber-700', season: sName })
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-amber-400 font-mono shrink-0">
          {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium text-zinc-100">{profile?.display_name}</h1>
          <p className="text-xs text-zinc-600 font-mono">{user!.id.slice(0, 8)}</p>
          <div className="flex items-center gap-2 mt-1">
            {profile?.university_email && (
              <Badge variant="chill">university</Badge>
            )}
            <span className="text-xs text-zinc-600">
              Joined {formatDate(profile?.created_at ?? user!.created_at)}
            </span>
          </div>
          {badges.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {badges.map((b) => (
                <span
                  key={b.season}
                  className={`px-2 py-0.5 rounded border text-xs font-mono font-bold ${b.color}`}
                >
                  {b.label} {b.season}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto text-right flex flex-col gap-1">
          {seasonRank ? (
            <>
              <p className="text-xs text-zinc-500">{currentSeason?.name} rank</p>
              <p className="text-2xl font-mono font-bold text-zinc-100">#{seasonRank.rank}</p>
              <p className="text-xs text-zinc-500">{seasonTotal.toFixed(0)} pts</p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">No scores yet</p>
          )}
        </div>
      </div>

      {/* Active round callout */}
      {activeRound && (
        <a
          href={`/seasons/${currentSeason?.number}/${activeRound.number}`}
          className="block border border-amber-900/50 bg-amber-950/20 rounded-lg p-4 hover:bg-amber-950/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-mono text-xs text-amber-400">
                Round {String(activeRound.number).padStart(2, '0')} · Open
              </p>
              <p className="text-sm text-zinc-100 mt-1">{activeRound.title}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">{attemptsRemaining} of 3 submissions left</p>
            </div>
          </div>
          <Countdown target={activeRound.closes_at} label="Closes in" />
        </a>
      )}

      <hr className="border-zinc-800" />

      {/* Submission history */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-400 font-mono uppercase tracking-wider">
          {currentSeason?.name} — Your Results
        </h2>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
              <tr>
                <th className="text-left py-2 px-4">Round</th>
                <th className="text-center py-2 px-4">Status</th>
                <th className="text-right py-2 px-4">Raw PnL</th>
                <th className="text-right py-2 px-4">Points</th>
                <th className="text-right py-2 px-4">Rank</th>
              </tr>
            </thead>
            <tbody>
              {(rounds ?? []).map((round) => {
                const sub = subsByRound.get(round.id)
                const score = scoresByRound.get(round.id)
                const opens = new Date(round.opens_at).getTime()
                const closes = new Date(round.closes_at).getTime()
                const now = Date.now()
                const isOpen = opens <= now && closes > now
                const isClosed = closes <= now
                const isUpcoming = opens > now

                return (
                  <tr key={round.id} className="border-t border-zinc-800">
                    <td className="py-3 px-4">
                      <a href={`/seasons/${currentSeason?.number}/${round.number}`} className="hover:text-amber-400 transition-colors">
                        <span className="font-mono text-xs text-zinc-500 mr-2">{String(round.number).padStart(2, '0')}</span>
                        <span className="text-zinc-100">{round.title}</span>
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isUpcoming && <span className="text-xs text-zinc-600">upcoming</span>}
                      {isOpen && !sub && <span className="text-xs text-amber-400">not submitted</span>}
                      {isOpen && sub && <span className="text-xs text-emerald-400">submitted</span>}
                      {isClosed && score && <span className="text-xs text-zinc-400">scored</span>}
                      {isClosed && !score && !sub && <span className="text-xs text-zinc-600">missed</span>}
                      {isClosed && sub && !score && <span className="text-xs text-zinc-400">pending</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {score?.raw_score != null ? score.raw_score.toFixed(2) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {score ? score.score.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {score ? `#${score.rank}` : '—'}
                    </td>
                  </tr>
                )
              })}
              {/* Season total row */}
              <tr className="border-t border-zinc-700 bg-zinc-900/50">
                <td className="py-3 px-4 text-sm text-zinc-400" colSpan={3}>
                  Season total
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium text-zinc-100">
                  {seasonTotal > 0 ? seasonTotal.toFixed(1) : '—'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-zinc-100">
                  {seasonRank ? `#${seasonRank.rank}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        <ShareProfileButton userId={user!.id} />
        <span className="text-zinc-800">·</span>
        <a href="/dashboard/settings" className="text-zinc-400 hover:text-zinc-100 transition-colors">Settings</a>
        <span className="text-zinc-800">·</span>
        <form action="/auth/signout" method="POST" className="inline">
          <button type="submit" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
