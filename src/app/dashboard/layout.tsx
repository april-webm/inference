import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (!user.email_confirmed_at) redirect('/auth/check-email')

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <a href="/" className="font-mono font-bold text-amber-400 tracking-tight">
          Inference
        </a>
        <div className="flex items-center gap-6 text-sm">
          <a href="/leaderboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            Leaderboard
          </a>
          <a href="/about" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            About
          </a>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
