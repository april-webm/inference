import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Markdown } from '@/components/Markdown'
import { SubmissionForm } from '@/components/SubmissionForm'
import type { Round, Submission } from '@/types/database'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nowIso = new Date().toISOString()

  const { data: liveRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('is_active', true)
    .lte('opens_at', nowIso)
    .gt('closes_at', nowIso)
    .order('number', { ascending: true })
    .limit(1)
    .maybeSingle<Round>()

  const round: Round | null = liveRound ?? null

  if (!round) {
    const { data: upcoming } = await supabase
      .from('rounds')
      .select('*')
      .gt('opens_at', nowIso)
      .order('opens_at', { ascending: true })
      .limit(1)
      .maybeSingle<Round>()

    if (upcoming) {
      return (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-zinc-500">
            Round {String(upcoming.number).padStart(2, '0')}
          </p>
          <h1 className="text-2xl font-medium text-zinc-100">{upcoming.title}</h1>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Badge variant={upcoming.difficulty}>{upcoming.difficulty}</Badge>
            <Badge variant="upcoming">upcoming</Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-2">
            Opens {formatDate(upcoming.opens_at)} UTC.
          </p>
          <p className="text-xs text-zinc-500">
            The problem statement will appear here when the round opens.
          </p>
        </div>
      )
    }

    return (
      <div className="text-zinc-400 text-sm">
        <p>No active round right now.</p>
        <p className="text-zinc-500 mt-2">
          Check back soon. The next challenge will be announced here.
        </p>
      </div>
    )
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', round.id)
    .eq('user_id', user!.id)
    .maybeSingle<Submission>()

  const { count: attemptsUsed } = await supabase
    .from('submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('round_id', round.id)
    .eq('user_id', user!.id)
  const submissionsRemaining = Math.max(0, 3 - (attemptsUsed ?? 0))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs text-zinc-500">
          Round {String(round.number).padStart(2, '0')}
        </p>
        <h1 className="text-2xl font-medium text-zinc-100">{round.title}</h1>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Badge variant={round.difficulty}>{round.difficulty}</Badge>
          <span>Closes {formatDate(round.closes_at)} UTC</span>
        </div>
      </div>

      {existing && (
        <div className="border border-emerald-900 bg-emerald-950/40 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-emerald-300">
              <span className="font-mono mr-2">✓</span>
              Submission received {formatDate(existing.submitted_at)} UTC
            </p>
            <p className="text-xs text-emerald-500/70">
              You can keep updating it until the round closes.
            </p>
          </div>
          <a href="#your-submission" className="text-xs text-emerald-300 hover:text-emerald-200 whitespace-nowrap">
            View ↓
          </a>
        </div>
      )}

      <hr className="border-zinc-800" />

      <Markdown>{round.description}</Markdown>

      <hr className="border-zinc-800" />

      <SubmissionForm
        roundId={round.id}
        closesAt={round.closes_at}
        existingAnswer={existing?.answer ?? null}
        existingReasoning={existing?.reasoning ?? null}
        submissionsRemaining={submissionsRemaining}
      />

      {existing && (
        <div id="your-submission" className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-sm font-medium text-zinc-100">Your current submission</h2>
          <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto">
            {JSON.stringify(existing.answer, null, 2)}
          </pre>
          <p className="text-xs text-zinc-400 whitespace-pre-wrap">{existing.reasoning}</p>
          <p className="text-xs text-zinc-600">
            Submitted {formatDate(existing.submitted_at)} UTC
          </p>
        </div>
      )}
    </div>
  )
}
