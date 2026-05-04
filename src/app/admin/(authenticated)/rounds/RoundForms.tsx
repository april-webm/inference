'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

interface Round {
  id: string
  number: number
  title: string
  tagline: string | null
  description: string | null
  difficulty: string
  opens_at: string
  closes_at: string
}

function toLocalDatetime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toISOString().slice(0, 16)
}

interface SeasonOption {
  id: string
  number: number
  name: string
}

export function SeasonSelector({
  seasons,
  selected,
}: {
  seasons: SeasonOption[]
  selected: number | null
}) {
  return (
    <select
      value={selected ?? ''}
      onChange={(e) => {
        const url = new URL(window.location.href)
        url.searchParams.set('season', e.target.value)
        window.location.href = url.toString()
      }}
      className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.number}>
          {s.name}
        </option>
      ))}
    </select>
  )
}

export function CreateRoundForm({ seasonId, seasonName }: { seasonId: string; seasonName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [opensAt, setOpensAt] = useState('')
  const [closesAt, setClosesAt] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/admin/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        season_id: seasonId,
        number: parseInt(number),
        title,
        tagline: tagline || null,
        description: description || null,
        difficulty,
        opens_at: new Date(opensAt).toISOString(),
        closes_at: new Date(closesAt).toISOString(),
      }),
    })

    setLoading(false)

    if (res.ok) {
      setMessage({ type: 'success', text: 'Round created.' })
      setNumber('')
      setTitle('')
      setTagline('')
      setDescription('')
      setDifficulty('medium')
      setOpensAt('')
      setClosesAt('')
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: body.error ?? 'Failed to create round.' })
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Create round in {seasonName}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-800 rounded p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="round-number"
          label="Number"
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          placeholder="1"
        />
        <Input
          id="round-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Round title"
        />
        <Input
          id="round-tagline"
          label="Tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Short tagline"
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="round-difficulty" className="text-sm text-zinc-400">Difficulty</label>
          <select
            id="round-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="chill">Chill</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <Input
          id="round-opens"
          label="Opens at"
          type="datetime-local"
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
          required
        />
        <Input
          id="round-closes"
          label="Closes at"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          required
        />
      </div>
      <Textarea
        id="round-description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Markdown description…"
        hint="Supports markdown"
      />

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

export function EditRoundButton({ round, seasonNumber }: { round: Round; seasonNumber?: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [title, setTitle] = useState(round.title)
  const [tagline, setTagline] = useState(round.tagline ?? '')
  const [description, setDescription] = useState(round.description ?? '')
  const [difficulty, setDifficulty] = useState(round.difficulty)
  const [opensAt, setOpensAt] = useState(toLocalDatetime(round.opens_at))
  const [closesAt, setClosesAt] = useState(toLocalDatetime(round.closes_at))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch(`/api/admin/rounds/${round.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        tagline: tagline || null,
        description: description || null,
        difficulty,
        opens_at: new Date(opensAt).toISOString(),
        closes_at: new Date(closesAt).toISOString(),
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
                id={`edit-title-${round.id}`}
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                id={`edit-tagline-${round.id}`}
                label="Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor={`edit-difficulty-${round.id}`} className="text-sm text-zinc-400">Difficulty</label>
                <select
                  id={`edit-difficulty-${round.id}`}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="chill">Chill</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div />
              <Input
                id={`edit-opens-${round.id}`}
                label="Opens at"
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                required
              />
              <Input
                id={`edit-closes-${round.id}`}
                label="Closes at"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                required
              />
            </div>
            <Textarea
              id={`edit-description-${round.id}`}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              hint="Supports markdown"
            />

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

          {seasonNumber != null && (
            <div className="border border-zinc-800 rounded p-4 mt-2 bg-[#0a0a0a] space-y-3">
              <h3 className="text-sm font-medium text-zinc-400">Round data file</h3>
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  setUploadResult(null)

                  const form = new FormData()
                  form.append('season', String(seasonNumber))
                  form.append('round', String(round.number))
                  form.append('file', file)

                  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
                  setUploading(false)

                  if (res.ok) {
                    const body = await res.json()
                    setUploadResult({ type: 'success', text: `Uploaded: ${body.path}` })
                  } else {
                    const body = await res.json().catch(() => ({}))
                    setUploadResult({ type: 'error', text: body.error ?? 'Upload failed.' })
                  }
                }}
                className="block text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-100 hover:file:bg-zinc-700 transition-colors"
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-amber-400">Uploading...</p>}
              {uploadResult && (
                <p className={uploadResult.type === 'success' ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>
                  {uploadResult.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function DeleteRoundButton({ round }: { round: Round }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/rounds/${round.id}`, {
      method: 'DELETE',
    })

    setLoading(false)

    if (res.ok) {
      setConfirming(false)
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to delete round.')
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-400">
          Delete round #{round.number} — {round.title}? This cannot be undone.
        </span>
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
