'use client'

import { Button } from '@/components/ui/Button'

interface Round {
  id: string
  number: number
  title: string
}

export function ExportButtons({ rounds }: { rounds: Round[] }) {
  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-sm font-medium text-zinc-400">Bulk export</h2>
      <div className="flex flex-wrap gap-2">
        <a href="/api/admin/export?table=scores" download>
          <Button variant="secondary" className="text-xs">Export all scores</Button>
        </a>
        <a href="/api/admin/export?table=profiles" download>
          <Button variant="secondary" className="text-xs">Export profiles</Button>
        </a>
      </div>
      {rounds.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">Export submissions per round:</p>
          <div className="flex flex-wrap gap-2">
            {rounds.map((r) => (
              <a key={r.id} href={`/api/admin/export?table=submissions&round_id=${r.id}`} download>
                <Button variant="secondary" className="text-xs">
                  #{r.number} {r.title}
                </Button>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
