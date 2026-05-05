import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Markdown } from '@/components/Markdown'
import { PublicNav } from '@/components/PublicNav'
import { Countdown } from '@/components/Countdown'
import { SubmissionForm } from '@/components/SubmissionForm'
import type { Round, Season, Submission } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string; round: string }>
}): Promise<Metadata> {
  const { season, round } = await params
  const supabase = await createSupabaseServerClient()
  const { data: seasonData } = await supabase
    .from('seasons').select('id, name').eq('number', parseInt(season)).maybeSingle()
  if (!seasonData) return { title: 'Round — Inference' }
  const { data: roundData } = await supabase
    .from('rounds').select('title, tagline')
    .eq('season_id', seasonData.id).eq('number', parseInt(round)).maybeSingle()
  if (!roundData) return { title: 'Round — Inference' }
  return {
    title: `${roundData.title} — Inference`,
    description: roundData.tagline,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function SeasonRoundDetail({
  params,
}: {
  params: Promise<{ season: string; round: string }>
}) {
  const { season, round: roundStr } = await params
  const seasonNum = Number(season)
  const roundNum = Number(roundStr)
  if (!Number.isInteger(seasonNum) || seasonNum < 0) notFound()
  if (!Number.isInteger(roundNum) || roundNum <= 0) notFound()

  const supabase = await createSupabaseServerClient()

  // Parallel: auth + season lookup
  const [{ data: { user } }, { data: seasonData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('seasons')
      .select('id, number, name')
      .eq('number', seasonNum)
      .maybeSingle<Pick<Season, 'id' | 'number' | 'name'>>(),
  ])

  if (!seasonData) notFound()

  const { data: roundMeta } = await supabase
    .from('rounds')
    .select('id, season_id, number, title, tagline, difficulty, opens_at, closes_at, is_active, created_at')
    .eq('season_id', seasonData.id)
    .eq('number', roundNum)
    .maybeSingle<Omit<Round, 'description'>>()

  if (!roundMeta) notFound()

  const now = Date.now()
  const opens = new Date(roundMeta.opens_at).getTime()
  const closes = new Date(roundMeta.closes_at).getTime()
  const isUpcoming = opens > now
  const isOpen = opens <= now && closes > now
  const isClosed = closes <= now

  // Parallel: description + submission + attempts (all independent)
  const descriptionPromise = !isUpcoming
    ? supabase.from('rounds').select('description, writeup').eq('id', roundMeta.id)
        .single<{ description: string; writeup: string | null }>()
    : Promise.resolve({ data: null })

  const subPromise = user && (isOpen || isClosed)
    ? supabase.from('submissions').select('*')
        .eq('round_id', roundMeta.id).eq('user_id', user.id)
        .maybeSingle<Submission>()
    : Promise.resolve({ data: null })


  const service = createSupabaseServiceClient()
  const submissionCountPromise = isOpen
    ? service.from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('round_id', roundMeta.id)
    : Promise.resolve({ count: null })

  const [descResult, subResult, countResult] = await Promise.all([
    descriptionPromise, subPromise, submissionCountPromise,
  ])

  const description = descResult.data?.description ?? ''
  const writeup = isClosed ? (descResult.data?.writeup ?? null) : null
  const existing = subResult.data ?? null
  const submissionCount = (countResult as { count: number | null }).count

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Back
        </a>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-zinc-500">
            {seasonData.name} · Round {String(roundMeta.number).padStart(2, '0')}
          </p>
          <h1 className="text-2xl font-medium text-zinc-100">{roundMeta.title}</h1>
          <p className="text-sm text-zinc-400">{roundMeta.tagline}</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
            <Badge variant={roundMeta.difficulty}>{roundMeta.difficulty}</Badge>
            {isOpen && <Badge variant="open">open</Badge>}
            {isClosed && <Badge variant="closed">closed</Badge>}
            {isUpcoming && <Badge variant="upcoming">upcoming</Badge>}
            {isUpcoming && <Countdown target={roundMeta.opens_at} label="Opens in" compact />}
            {isOpen && <Countdown target={roundMeta.closes_at} label="Closes in" compact />}
            {isClosed && <span>Closed {formatDate(roundMeta.closes_at)}</span>}
            {isOpen && submissionCount != null && (
              <span className="text-zinc-500">{submissionCount} submission{submissionCount !== 1 ? 's' : ''} so far</span>
            )}
          </div>
        </div>

        <hr className="border-zinc-800" />

        {isUpcoming && (
          <p className="text-sm text-zinc-500">
            The problem statement will appear here when this round opens.
          </p>
        )}

        {!isUpcoming && <Markdown>{description}</Markdown>}

        {/* Submission section */}
        {isOpen && user && (
          <>
            <hr className="border-zinc-800" />

            {existing && (
              <div className="border border-emerald-900 bg-emerald-950/40 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-emerald-300">
                    <span className="font-mono mr-2">✓</span>
                    Submission received
                  </p>
                  <p className="text-xs text-emerald-500/70">
                    You can update it until the round closes.
                  </p>
                </div>
                <a href="#your-submission" className="text-xs text-emerald-300 hover:text-emerald-200 whitespace-nowrap">
                  View ↓
                </a>
              </div>
            )}

            <SubmissionForm
              roundId={roundMeta.id}
              roundNumber={roundMeta.number}
              closesAt={roundMeta.closes_at}
              existingAnswer={existing?.answer ?? null}
              existingReasoning={existing?.reasoning ?? null}
            />

            {existing && (
              <div id="your-submission" className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 flex flex-col gap-3 scroll-mt-6">
                <h2 className="text-sm font-medium text-zinc-100">Your current submission</h2>
                <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto">
                  {JSON.stringify(existing.answer, null, 2)}
                </pre>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap">{existing.reasoning}</p>
              </div>
            )}
          </>
        )}

        {isOpen && !user && (
          <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 text-sm text-center">
            <a href="/auth/login" className="text-amber-400 hover:text-amber-300">
              Log in to submit your answer
            </a>
          </div>
        )}

        {isClosed && writeup && (
          <>
            <hr className="border-zinc-800" />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium text-amber-400">Solution Writeup</h2>
              <Markdown>{writeup}</Markdown>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
