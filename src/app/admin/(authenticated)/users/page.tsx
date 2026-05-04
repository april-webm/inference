import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
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

  return (
    <div className="max-w-5xl">
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
