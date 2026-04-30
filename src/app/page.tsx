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
  if (round.is_active && closes > now) return 'open'
  if (closes <= now) return 'closed'
  if (opens > now) return 'upcoming'
  return 'closed'
}

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .order('number', { ascending: true })
    .returns<Round[]>()

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-mono text-4xl font-bold text-amber-400 tracking-tight">
            Inference
          </h1>
          <p className="text-zinc-400 text-lg">
            Three problems. Three weeks.
          </p>
        </header>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <a href="/dashboard" className="bg-amber-400 text-zinc-900 hover:bg-amber-300 px-4 py-2 rounded text-sm font-medium transition-colors">
                Dashboard
              </a>
              <a href="/leaderboard" className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded text-sm font-medium transition-colors">
                Leaderboard
              </a>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-2">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <a href="/auth/signup" className="bg-amber-400 text-zinc-900 hover:bg-amber-300 px-4 py-2 rounded text-sm font-medium transition-colors">
                Sign up
              </a>
              <a href="/auth/login" className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded text-sm font-medium transition-colors">
                Log in
              </a>
            </>
          )}
        </div>

        <hr className="border-zinc-800" />

        <div className="flex flex-col gap-4">
          {(rounds ?? []).map((round) => {
            const status = statusFor(round)
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
                </div>
              </div>
            )
            const isViewable = status !== 'upcoming'
            return isViewable ? (
              <a key={round.id} href={`/rounds/${round.number}`} className="block hover:opacity-90 transition-opacity">
                {card}
              </a>
            ) : (
              <div key={round.id}>{card}</div>
            )
          })}
        </div>

        <hr className="border-zinc-800" />

        <p className="text-xs text-zinc-600 text-center">
          Made for students who want to think seriously about markets.
        </p>
      </main>
    </div>
  )
}
