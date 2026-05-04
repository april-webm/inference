'use client'

import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/seasons', label: 'Seasons' },
  { href: '/admin/rounds', label: 'Rounds' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/scores', label: 'Scores' },
  { href: '/admin/emails', label: 'Emails' },
  { href: '/admin/webhooks', label: 'Webhooks' },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <nav className="w-56 border-r border-zinc-800 p-4 flex flex-col gap-1 shrink-0">
      <a href="/" className="font-mono font-bold text-amber-400 tracking-tight text-sm mb-1">
        Inference
      </a>
      <span className="text-[10px] text-zinc-600 uppercase tracking-widest mb-4">Admin</span>

      {links.map(({ href, label }) => {
        const active = href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(href)
        return (
          <a
            key={href}
            href={href}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              active
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            {label}
          </a>
        )
      })}

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
