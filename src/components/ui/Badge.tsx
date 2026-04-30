import { Difficulty } from '@/types/database'

const colours: Record<Difficulty | 'open' | 'closed' | 'upcoming', string> = {
  chill:    'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  medium:   'bg-amber-900/50 text-amber-400 border-amber-800',
  hard:     'bg-red-900/50 text-red-400 border-red-800',
  open:     'bg-blue-900/50 text-blue-400 border-blue-800',
  closed:   'bg-zinc-800 text-zinc-500 border-zinc-700',
  upcoming: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

interface BadgeProps {
  variant: Difficulty | 'open' | 'closed' | 'upcoming'
  children: React.ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${colours[variant]}`}>
      {children}
    </span>
  )
}
