import type { Metadata } from 'next'
import Image from 'next/image'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/PublicNav'
import { countryFlag } from '@/lib/countries'
import type { Profile, Rating, RatingHistory, Score, Season } from '@/types/database'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const serviceClient = createSupabaseServiceClient()
  const { data } = await serviceClient
    .from('profiles').select('display_name').eq('id', id).maybeSingle()
  return {
    title: data ? `${data.display_name} — Inference` : 'Profile — Inference',
  }
}

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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  // Use service client for profile fetch to bypass RLS (this is a public page)
  const serviceClient = createSupabaseServiceClient()

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, display_name, university_email, country_code, created_at, is_hidden')
    .eq('id', id)
    .maybeSingle<Profile & { is_hidden: boolean }>()

  if (!profile || profile.is_hidden) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-sm text-zinc-400">Profile not found.</p>
        </main>
      </div>
    )
  }

  // Get all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, number, name')
    .order('number', { ascending: false })
    .returns<Pick<Season, 'id' | 'number' | 'name'>[]>()

  // Get all scores for this user
  const { data: scores } = await supabase
    .from('scores')
    .select('round_id, score, raw_score, rank')
    .eq('user_id', id)
    .returns<Score[]>()

  // Get rounds info
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, season_id, number, title, difficulty')
    .returns<{ id: string; season_id: string; number: number; title: string; difficulty: string }[]>()

  // Season leaderboard ranks
  const { data: seasonRanks } = await supabase
    .from('season_leaderboard')
    .select('season_id, rank, total_score')
    .eq('user_id', id)
    .returns<{ season_id: string; rank: number; total_score: number }[]>()

  // Fetch user rating
  const { data: userRating } = await supabase
    .from('ratings')
    .select('user_id, rating, rd, volatility, updated_at')
    .eq('user_id', id)
    .maybeSingle<Rating>()

  // Fetch rating history
  const { data: ratingHistory } = await supabase
    .from('rating_history')
    .select('id, user_id, round_id, rating, rd, volatility, computed_at')
    .eq('user_id', id)
    .order('computed_at', { ascending: true })
    .returns<RatingHistory[]>()

  const scoresByRound = new Map(scores?.map((s) => [s.round_id, s]) ?? [])
  const roundsById = new Map(rounds?.map((r) => [r.id, r]) ?? [])
  const seasonRankMap = new Map(seasonRanks?.map((s) => [s.season_id, s]) ?? [])

  // Compute badges from season placements
  const badges: { label: string; color: string; season: string; seasonNumber: number }[] = []
  for (const season of seasons ?? []) {
    const sRank = seasonRankMap.get(season.id)
    if (!sRank) continue
    if (sRank.rank === 1) badges.push({ label: '1st', color: 'border-amber-400 text-amber-400', season: season.name, seasonNumber: season.number })
    else if (sRank.rank === 2) badges.push({ label: '2nd', color: 'border-zinc-400 text-zinc-400', season: season.name, seasonNumber: season.number })
    else if (sRank.rank === 3) badges.push({ label: '3rd', color: 'border-amber-700 text-amber-700', season: season.name, seasonNumber: season.number })
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
        <a href="/leaderboard" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Leaderboard
        </a>

        {/* Profile header */}
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-amber-400 font-mono shrink-0">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium text-zinc-100">
              {profile.country_code && (
                <span className="mr-2">{countryFlag(profile.country_code)}</span>
              )}
              {profile.display_name}
            </h1>
            <p className="text-xs text-zinc-600 font-mono">{profile.id.slice(0, 8)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-600">
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
            {badges.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {badges.map((b) => {
                  const badgeSvg = b.label === '1st' ? '/badges/gold.svg' : b.label === '2nd' ? '/badges/silver.svg' : '/badges/bronze.svg'
                  return (
                    <span
                      key={b.season}
                      className={`px-2 py-0.5 rounded border text-xs font-mono font-bold ${b.color} flex items-center gap-1`}
                      title={`${b.label} — ${b.season}`}
                    >
                      <Image src={badgeSvg} alt={b.label} width={14} height={14} />
                      S{b.seasonNumber}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Rating card */}
        {userRating && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-zinc-400 font-mono uppercase tracking-wider">
              Rating
            </h2>
            <div className="border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-mono font-bold text-zinc-100">
                  {Math.round(userRating.rating)}
                </span>
                <span className="text-sm font-mono text-zinc-500">
                  &plusmn; {Math.round(userRating.rd)}
                </span>
                {userRating.rd > 150 && (
                  <span className="text-xs text-amber-400 font-mono">provisional</span>
                )}
              </div>

              {/* Rating history */}
              {ratingHistory && ratingHistory.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  <h3 className="text-xs text-zinc-500 font-mono uppercase">History</h3>
                  <div className="flex flex-col gap-1">
                    {ratingHistory.map((h) => {
                      const round = roundsById.get(h.round_id)
                      return (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">
                            {round ? `R${round.number} ${round.title}` : h.round_id.slice(0, 8)}
                          </span>
                          <span className="font-mono text-zinc-300">
                            {Math.round(h.rating)} &plusmn; {Math.round(h.rd)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Season results */}
        {(seasons ?? []).map((season) => {
          const sRank = seasonRankMap.get(season.id)
          const seasonRounds = (rounds ?? [])
            .filter((r) => r.season_id === season.id)
            .sort((a, b) => a.number - b.number)

          if (seasonRounds.every((r) => !scoresByRound.has(r.id))) return null

          return (
            <div key={season.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-400 font-mono uppercase tracking-wider">
                  {season.name}
                </h2>
                {sRank && (
                  <span className="text-sm font-mono text-zinc-300">
                    #{sRank.rank} · {sRank.total_score.toFixed(0)} pts
                  </span>
                )}
              </div>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                    <tr>
                      <th className="text-left py-2 px-4">Round</th>
                      <th className="text-right py-2 px-4">Raw</th>
                      <th className="text-right py-2 px-4">Points</th>
                      <th className="text-right py-2 px-4">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonRounds.map((round) => {
                      const score = scoresByRound.get(round.id)
                      return (
                        <tr key={round.id} className={`border-t border-zinc-800 ${score ? rankBorder(score.rank) : ''}`}>
                          <td className="py-2 px-4">
                            <span className="font-mono text-xs text-zinc-500 mr-2">{String(round.number).padStart(2, '0')}</span>
                            <span className="text-zinc-100">{round.title}</span>
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-zinc-300">
                            {score?.raw_score != null ? score.raw_score.toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-zinc-300">
                            {score ? score.score.toFixed(1) : '—'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-zinc-300">
                            {score ? `#${score.rank}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {(!scores || scores.length === 0) && (
          <p className="text-sm text-zinc-500">No scored rounds yet.</p>
        )}
      </main>
    </div>
  )
}
