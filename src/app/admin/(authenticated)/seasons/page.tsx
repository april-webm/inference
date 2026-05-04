import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { CreateSeasonForm, EditSeasonButton, DeleteSeasonButton } from './CreateSeasonForm'

export const dynamic = 'force-dynamic'

export default async function AdminSeasonsPage() {
  const supabase = createSupabaseServiceClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('number', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-100">Seasons</h1>
      </div>

      <div className="mb-6">
        <CreateSeasonForm />
      </div>

      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Starts</th>
              <th className="px-4 py-2 font-medium">Ends</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(seasons ?? []).map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-2 font-mono text-zinc-500">{s.number}</td>
                <td className="px-4 py-2 text-zinc-100">{s.name}</td>
                <td className="px-4 py-2 text-zinc-400">
                  {s.starts_at ? new Date(s.starts_at).toLocaleDateString('en-AU') : '—'}
                </td>
                <td className="px-4 py-2 text-zinc-400">
                  {s.ends_at ? new Date(s.ends_at).toLocaleDateString('en-AU') : '—'}
                </td>
                <td className="px-4 py-2 relative">
                  <div className="flex gap-2">
                    <EditSeasonButton season={s as any} />
                    <DeleteSeasonButton season={s as any} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
