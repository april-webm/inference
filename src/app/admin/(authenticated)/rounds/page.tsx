import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { CreateRoundForm, SeasonSelector } from './RoundForms'
import { RoundsTable } from './RoundsTable'

export const dynamic = 'force-dynamic'

export default async function AdminRoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const { season: seasonParam } = await searchParams
  const supabase = createSupabaseServiceClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, number, name')
    .order('number', { ascending: false })

  const allSeasons = seasons ?? []

  const selectedSeason = seasonParam
    ? allSeasons.find((s) => String(s.number) === seasonParam)
    : allSeasons[0]

  const { data: rounds } = selectedSeason
    ? await supabase
        .from('rounds')
        .select('id, number, title, tagline, description, difficulty, opens_at, closes_at')
        .eq('season_id', selectedSeason.id)
        .order('number')
    : { data: [] }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-100">Rounds</h1>
        <SeasonSelector
          seasons={allSeasons}
          selected={selectedSeason?.number ?? null}
        />
      </div>

      {selectedSeason && (
        <div className="mb-6">
          <CreateRoundForm seasonId={selectedSeason.id} seasonName={selectedSeason.name} />
        </div>
      )}

      <RoundsTable
        rounds={(rounds ?? []) as any}
        seasonNumber={selectedSeason?.number}
      />
    </div>
  )
}
