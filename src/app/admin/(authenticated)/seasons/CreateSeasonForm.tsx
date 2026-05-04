'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Season {
  id: string
  number: number
  name: string
  starts_at: string | null
  ends_at: string | null
}

function toLocalDatetime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toISOString().slice(0, 16)
}

export function EditSeasonButton({ season }: { season: Season }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState(season.name)
  const [startsAt, setStartsAt] = useState(toLocalDatetime(season.starts_at))
  const [endsAt, setEndsAt] = useState(toLocalDatetime(season.ends_at))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch(`/api/admin/seasons/${season.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    })

    setLoading(false)

    if (res.ok) {
      setMessage({ type: 'success', text: 'Saved.' })
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: body.error ?? 'Failed to save.' })
    }
  }

  return (
    <>
      <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Edit'}
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-10">
          <form onSubmit={handleSubmit} className="border border-zinc-800 rounded p-4 space-y-4 bg-[#0a0a0a]">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id={`edit-name-${season.id}`}
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div />
              <Input
                id={`edit-starts-${season.id}`}
                label="Starts at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              <Input
                id={`edit-ends-${season.id}`}
                label="Ends at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>

            {message && (
              <p className={message.type === 'success' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
                {message.text}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export function DeleteSeasonButton({ season }: { season: Season }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/seasons/${season.id}`, {
      method: 'DELETE',
    })

    setLoading(false)

    if (res.ok) {
      setConfirming(false)
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to delete season.')
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-400">Are you sure? This cannot be undone.</span>
        <Button variant="primary" className="text-xs px-2 py-1" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting…' : 'Confirm'}
        </Button>
        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => { setConfirming(false); setError(null) }}>
          Cancel
        </Button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <Button variant="secondary" className="text-xs px-2 py-1 text-red-400" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  )
}

export function CreateSeasonForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/admin/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: parseInt(number),
        name,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    })

    setLoading(false)

    if (res.ok) {
      setMessage({ type: 'success', text: 'Season created.' })
      setNumber('')
      setName('')
      setStartsAt('')
      setEndsAt('')
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: body.error ?? 'Failed to create season.' })
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Create season
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-800 rounded p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="season-number"
          label="Number"
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          placeholder="5"
        />
        <Input
          id="season-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Season 5"
        />
        <Input
          id="season-starts"
          label="Starts at"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <Input
          id="season-ends"
          label="Ends at"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
      </div>

      {message && (
        <p className={message.type === 'success' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
          {message.text}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create'}
        </Button>
        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
