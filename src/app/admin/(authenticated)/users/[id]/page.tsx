import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifyAdminSession } from '@/lib/admin-session'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await verifyAdminSession())) {
    notFound()
  }

  const { id } = await params
  const supabase = createSupabaseServiceClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, university_email, is_hidden, email_opt_out, created_at')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // Try to get email from auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(id)

  // Fetch submissions with round info
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, round_id, answer, reasoning, created_at, rounds(number, title)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch scores with round info
  const { data: scores } = await supabase
    .from('scores')
    .select('round_id, score, raw_score, rank')
    .eq('user_id', id)

  // Get rounds for score display
  const roundIds = scores?.map((s) => s.round_id) ?? []
  const { data: rounds } = roundIds.length > 0
    ? await supabase
        .from('rounds')
        .select('id, number, title')
        .in('id', roundIds)
    : { data: [] }

  const roundsById = new Map(rounds?.map((r) => [r.id, r]) ?? [])

  function truncate(value: unknown, maxLen = 80): string {
    if (value == null) return ''
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/users"
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        &larr; Back to users
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-xl font-medium text-zinc-100 mb-4">{profile.display_name}</h1>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
          <dt className="text-zinc-500">User ID</dt>
          <dd className="font-mono text-zinc-300 text-xs">{profile.id}</dd>
          <dt className="text-zinc-500">Email</dt>
          <dd className="text-zinc-300">{authUser?.user?.email ?? 'N/A'}</dd>
          <dt className="text-zinc-500">University email</dt>
          <dd className="text-zinc-300">{profile.university_email || 'None'}</dd>
          <dt className="text-zinc-500">Hidden</dt>
          <dd className="text-zinc-300">{profile.is_hidden ? 'Yes' : 'No'}</dd>
          <dt className="text-zinc-500">Email opt-out</dt>
          <dd className="text-zinc-300">{profile.email_opt_out ? 'Yes' : 'No'}</dd>
          <dt className="text-zinc-500">Joined</dt>
          <dd className="text-zinc-300">
            {new Date(profile.created_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </dd>
        </dl>
      </div>

      {/* Submissions */}
      <section className="mb-8">
        <h2 className="text-lg font-medium text-zinc-100 mb-3">
          Submissions ({submissions?.length ?? 0})
        </h2>
        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                <th className="px-4 py-2 font-medium">Round</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Answer</th>
                <th className="px-4 py-2 font-medium">Reasoning</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {(submissions ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-sm">
                    No submissions.
                  </td>
                </tr>
              )}
              {(submissions ?? []).map((s) => {
                const roundRaw = s.rounds as unknown
                const round = Array.isArray(roundRaw) ? roundRaw[0] as { number: number; title: string } | undefined : roundRaw as { number: number; title: string } | null
                return (
                  <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-zinc-400">{round?.number ?? '?'}</td>
                    <td className="px-4 py-2 text-zinc-300">{round?.title ?? ''}</td>
                    <td className="px-4 py-2 text-zinc-400 font-mono text-xs max-w-[200px] truncate">
                      {truncate(s.answer)}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs max-w-[200px] truncate">
                      {truncate(s.reasoning)}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString('en-AU', { timeZone: 'UTC' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scores */}
      <section>
        <h2 className="text-lg font-medium text-zinc-100 mb-3">
          Scores ({scores?.length ?? 0})
        </h2>
        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                <th className="px-4 py-2 font-medium">Round</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Raw score</th>
                <th className="px-4 py-2 font-medium">Normalised score</th>
                <th className="px-4 py-2 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody>
              {(scores ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-sm">
                    No scores.
                  </td>
                </tr>
              )}
              {(scores ?? []).map((s) => {
                const round = roundsById.get(s.round_id)
                return (
                  <tr key={s.round_id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-zinc-400">{round?.number ?? '?'}</td>
                    <td className="px-4 py-2 text-zinc-300">{round?.title ?? ''}</td>
                    <td className="px-4 py-2 text-zinc-300 font-mono">
                      {s.raw_score != null ? Number(s.raw_score).toFixed(4) : ''}
                    </td>
                    <td className="px-4 py-2 text-zinc-100 font-mono">
                      {s.score != null ? Number(s.score).toFixed(4) : ''}
                    </td>
                    <td className="px-4 py-2 text-amber-400 font-mono">{s.rank ?? ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
