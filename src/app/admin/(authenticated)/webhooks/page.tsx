import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminWebhooksPage() {
  const supabase = createSupabaseServiceClient()

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id, user_id, url, events, enabled, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-medium text-zinc-100 mb-6">Webhooks</h1>

      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">URL</th>
              <th className="px-4 py-2 font-medium">Events</th>
              <th className="px-4 py-2 font-medium">Enabled</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {(!webhooks || webhooks.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-sm">
                  No webhooks registered.
                </td>
              </tr>
            )}
            {(webhooks ?? []).map((wh: any) => (
              <tr key={wh.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-2 text-zinc-100">
                  {wh.profiles?.display_name ?? wh.user_id.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-zinc-300 font-mono text-xs truncate max-w-[200px]" title={wh.url}>
                  {wh.url.length > 40 ? wh.url.slice(0, 40) + '...' : wh.url}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev: string) => (
                      <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {ev}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={wh.enabled ? 'text-emerald-400' : 'text-zinc-600'}>
                    {wh.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-2 text-zinc-400 text-xs">
                  {new Date(wh.created_at).toLocaleDateString('en-AU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
