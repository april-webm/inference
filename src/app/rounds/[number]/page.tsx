import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Markdown } from '@/components/Markdown'
import { PublicNav } from '@/components/PublicNav'
import type { Round } from '@/types/database'

export const dynamic = 'force-dynamic'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function RoundDetail({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const { number } = await params
  const parsed = Number(number)
  if (!Number.isInteger(parsed) || parsed <= 0) notFound()

  const supabase = await createSupabaseServerClient()
  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('number', parsed)
    .maybeSingle<Round>()

  if (!round) notFound()

  const now = Date.now()
  const opens = new Date(round.opens_at).getTime()
  const closes = new Date(round.closes_at).getTime()
  const isUpcoming = opens > now
  const isOpen = round.is_active && opens <= now && closes > now
  const isClosed = closes <= now

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        <a href="/rounds" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← All rounds
        </a>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-zinc-500">
            Round {String(round.number).padStart(2, '0')}
          </p>
          <h1 className="text-2xl font-medium text-zinc-100">{round.title}</h1>
          <p className="text-sm text-zinc-400">{round.tagline}</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
            <Badge variant={round.difficulty}>{round.difficulty}</Badge>
            {isOpen && <Badge variant="open">open</Badge>}
            {isClosed && <Badge variant="closed">closed</Badge>}
            {isUpcoming && <Badge variant="upcoming">upcoming</Badge>}
            <span>
              {isUpcoming
                ? `Opens ${formatDate(round.opens_at)}`
                : isClosed
                ? `Closed ${formatDate(round.closes_at)}`
                : `Closes ${formatDate(round.closes_at)}`}
            </span>
          </div>
        </div>

        <hr className="border-zinc-800" />

        {isUpcoming ? (
          <p className="text-sm text-zinc-500">
            The problem statement will appear here when this round opens.
          </p>
        ) : (
          <Markdown>{round.description}</Markdown>
        )}

        {isOpen && (
          <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 text-sm">
            <a href="/dashboard" className="text-amber-400 hover:text-amber-300">
              Go to dashboard to submit →
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
