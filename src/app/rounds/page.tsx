import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PublicNav } from '@/components/PublicNav'
import type { Round } from '@/types/database'

export const dynamic = 'force-dynamic'

type Status = 'open' | 'closed' | 'upcoming'

function statusFor(round: Round): Status {
  const now = Date.now()
  const opens = new Date(round.opens_at).getTime()
  const closes = new Date(round.closes_at).getTime()
  if (round.is_active && opens <= now && closes > now) return 'open'
  if (closes <= now) return 'closed'
  if (opens > now) return 'upcoming'
  return 'closed'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function RoundsIndex() {
  const supabase = await createSupabaseServerClient()
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .order('number', { ascending: true })
    .returns<Round[]>()

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-zinc-100">Rounds</h1>
        <div className="flex flex-col gap-4">
          {(rounds ?? []).map((round) => {
            const status = statusFor(round)
            const isViewable = status !== 'upcoming'
            const card = (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col gap-2">
                <p className="font-mono text-xs text-zinc-500">
                  Round {String(round.number).padStart(2, '0')}
                </p>
                <h2 className="text-lg font-medium text-zinc-100">{round.title}</h2>
                <p className="text-sm text-zinc-500">{round.tagline}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={round.difficulty}>{round.difficulty}</Badge>
                  <Badge variant={status}>{status}</Badge>
                  <span className="text-xs text-zinc-600 ml-auto">
                    {status === 'upcoming' ? `Opens ${formatDate(round.opens_at)}` : null}
                    {status === 'closed' ? `Closed ${formatDate(round.closes_at)}` : null}
                    {status === 'open' ? `Closes ${formatDate(round.closes_at)}` : null}
                  </span>
                </div>
              </div>
            )
            return isViewable ? (
              <a key={round.id} href={`/rounds/${round.number}`} className="block hover:opacity-90 transition-opacity">
                {card}
              </a>
            ) : (
              <div key={round.id}>{card}</div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
