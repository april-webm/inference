'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function ToggleHiddenButton({ userId, isHidden }: { userId: string; isHidden: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_hidden: !isHidden }),
    })

    setLoading(false)

    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to update.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="text-xs px-2 py-1"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? '…' : isHidden ? 'Unhide' : 'Hide'}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
