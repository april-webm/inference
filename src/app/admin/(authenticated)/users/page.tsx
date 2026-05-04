import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { countryFlag } from '@/lib/countries'
import { ToggleHiddenButton } from './ToggleHiddenButton'
import { UserSearch } from './UserSearch'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = createSupabaseServiceClient()

  let query = supabase
    .from('profiles')
    .select('id, display_name, university_email, is_hidden, email_opt_out, created_at')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('display_name', `%${q}%`)
  } else {
    query = query.limit(100)
  }

  const { data: profiles } = await query

  // Stats queries (all users, not filtered)
  const [
    { count: totalUsers },
    { data: allProfiles },
    { data: submitterRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, university_email, email_opt_out, country_code'),
    supabase.from('submissions').select('user_id'),
  ])

  const total = totalUsers ?? 0
  const allP = allProfiles ?? []
  const submitterIds = new Set((submitterRows ?? []).map((s) => s.user_id))
  const active = submitterIds.size
  const inactive = total - active
  const uniCount = allP.filter((p) => p.university_email).length
  const nonUniCount = total - uniCount
  const emailOptOut = allP.filter((p) => p.email_opt_out).length

  // Country distribution
  const countryCounts = new Map<string, number>()
  for (const p of allP) {
    if (p.country_code) {
      countryCounts.set(p.country_code, (countryCounts.get(p.country_code) ?? 0) + 1)
    }
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const maxCountryCount = topCountries.length > 0 ? topCountries[0][1] : 1

  return (
    <div className="max-w-5xl">
      {/* User stats summary */}
      <div className="border border-zinc-800 rounded-lg p-5 mb-6 bg-zinc-900/50">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">User Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="bg-zinc-800/50 rounded px-3 py-2">
            <p className="text-[11px] text-zinc-500">Total</p>
            <p className="text-sm font-medium text-zinc-100">{total}</p>
          </div>
          <div className="bg-zinc-800/50 rounded px-3 py-2">
            <p className="text-[11px] text-zinc-500">Active (submitted)</p>
            <p className="text-sm font-medium text-emerald-400">{active}</p>
          </div>
          <div className="bg-zinc-800/50 rounded px-3 py-2">
            <p className="text-[11px] text-zinc-500">Inactive</p>
            <p className="text-sm font-medium text-zinc-400">{inactive}</p>
          </div>
          <div className="bg-zinc-800/50 rounded px-3 py-2">
            <p className="text-[11px] text-zinc-500">Email opt-out</p>
            <p className="text-sm font-medium text-zinc-100">{emailOptOut}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* University breakdown */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 mb-2">University vs non-university</h3>
            <div className="flex gap-4">
              <div className="bg-zinc-800/50 rounded px-3 py-2 flex-1">
                <p className="text-[11px] text-zinc-500">University</p>
                <p className="text-sm font-medium text-amber-400">
                  {uniCount} <span className="text-zinc-500 text-xs">({total > 0 ? Math.round((uniCount / total) * 100) : 0}%)</span>
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded px-3 py-2 flex-1">
                <p className="text-[11px] text-zinc-500">Non-university</p>
                <p className="text-sm font-medium text-zinc-100">
                  {nonUniCount} <span className="text-zinc-500 text-xs">({total > 0 ? Math.round((nonUniCount / total) * 100) : 0}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Country distribution */}
          <div>
            <h3 className="text-xs font-medium text-zinc-400 mb-2">Top countries</h3>
            <div className="space-y-1">
              {topCountries.map(([code, count]) => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-center">{countryFlag(code)}</span>
                  <span className="text-zinc-400 w-6 uppercase">{code}</span>
                  <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-400/70 rounded"
                      style={{ width: `${(count / maxCountryCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-zinc-500 w-8 text-right">{count}</span>
                </div>
              ))}
              {topCountries.length === 0 && (
                <p className="text-zinc-500 text-xs">No country data.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-100">Users</h1>
        <UserSearch />
      </div>

      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Uni</th>
              <th className="px-4 py-2 font-medium">Hidden</th>
              <th className="px-4 py-2 font-medium">Email opt-out</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 text-sm">
                  {q ? `No users matching "${q}".` : 'No users found.'}
                </td>
              </tr>
            )}
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-2 text-zinc-100">
                  <Link
                    href={`/admin/users/${p.id}`}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {p.display_name}
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-zinc-500 text-xs">{p.id.slice(0, 8)}</td>
                <td className="px-4 py-2">{p.university_email ? '✓' : ''}</td>
                <td className="px-4 py-2">{p.is_hidden ? '✓' : ''}</td>
                <td className="px-4 py-2">{p.email_opt_out ? '✓' : ''}</td>
                <td className="px-4 py-2 text-zinc-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString('en-AU')}
                </td>
                <td className="px-4 py-2">
                  <ToggleHiddenButton userId={p.id} isHidden={p.is_hidden} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
