import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function PublicNav() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
      <a href="/" className="font-mono font-bold text-amber-400 tracking-tight">
        Inference
      </a>
      <div className="flex items-center gap-6 text-sm">
        <a href="/rounds" className="text-zinc-400 hover:text-zinc-100 transition-colors">
          Rounds
        </a>
        <a href="/leaderboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">
          Leaderboard
        </a>
        {user ? (
          <>
            <a href="/dashboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Dashboard
            </a>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <a href="/auth/login" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            Sign in
          </a>
        )}
      </div>
    </nav>
  )
}
