import ReactMarkdown from 'react-markdown'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
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

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('is_active', true)
    .maybeSingle<Round>()

  if (!round) {
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

      <hr className="border-zinc-800" />

      <article className="prose prose-invert prose-zinc max-w-none">
        <ReactMarkdown>{round.description}</ReactMarkdown>
      </article>

      <hr className="border-zinc-800" />

      <SubmissionForm
        roundId={round.id}
        closesAt={round.closes_at}
        existingAnswer={existing?.answer ?? null}
        existingReasoning={existing?.reasoning ?? null}
      />

      {existing && (
        <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 flex flex-col gap-3">
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
