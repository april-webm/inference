'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  return new Date(iso).toISOString().slice(0, 16)
}

export function RoundsTable({
  rounds,
  seasonNumber,
}: {
  rounds: Round[]
  seasonNumber?: number
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const now = Date.now()

  const editingRound = rounds.find((r) => r.id === editingId) ?? null

  return (
    <>
      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Difficulty</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Opens</th>
              <th className="px-4 py-2 font-medium">Closes</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rounds.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 text-sm">
                  No rounds yet. Create one above.
                </td>
              </tr>
            )}
            {rounds.map((r) => {
              const opens = new Date(r.opens_at).getTime()
              const closes = new Date(r.closes_at).getTime()
              const status = now < opens ? 'upcoming' : now < closes ? 'open' : 'closed'
              const statusColour = {
                upcoming: 'text-zinc-500',
                open: 'text-emerald-400',
                closed: 'text-zinc-400',
              }[status]
              const diffColour = {
                chill: 'text-emerald-400',
                medium: 'text-amber-400',
                hard: 'text-red-400',
              }[r.difficulty as 'chill' | 'medium' | 'hard'] ?? 'text-zinc-400'

              return (
                <tr key={r.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-zinc-500">{r.number}</td>
                  <td className="px-4 py-2 text-zinc-100">{r.title}</td>
                  <td className={`px-4 py-2 ${diffColour}`}>{r.difficulty}</td>
                  <td className={`px-4 py-2 ${statusColour}`}>{status}</td>
                  <td className="px-4 py-2 text-zinc-400 text-xs">
                    {new Date(r.opens_at).toLocaleString('en-AU', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-4 py-2 text-zinc-400 text-xs">
                    {new Date(r.closes_at).toLocaleString('en-AU', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                      >
                        {editingId === r.id ? 'Close' : 'Edit'}
                      </Button>
                      {status === 'closed' && (
                        <Link
                          href={`/admin/rounds/${r.id}`}
                          className="inline-flex items-center text-xs px-2 py-1 rounded border border-zinc-700 bg-zinc-900 text-amber-400 hover:bg-zinc-800 transition-colors"
                        >
                          Writeup
                        </Link>
                      )}
                      <DeleteRoundButton round={r} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editingRound && (
        <div className="mt-4">
          <EditRoundForm
            key={editingRound.id}
            round={editingRound}
            seasonNumber={seasonNumber}
            onClose={() => setEditingId(null)}
          />
        </div>
      )}
    </>
  )
}

function EditRoundForm({
  round,
  seasonNumber,
  onClose,
}: {
  round: Round
  seasonNumber?: number
  onClose: () => void
}) {
  const router = useRouter()
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

  async function handleUpload(file: File) {
    if (!seasonNumber) return
    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('season', String(seasonNumber))
    formData.append('round', String(round.number))
    formData.append('file', file)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    setUploading(false)

    if (res.ok) {
      setUploadResult({ type: 'success', text: `Uploaded ${file.name}` })
    } else {
      const body = await res.json().catch(() => ({}))
      setUploadResult({ type: 'error', text: body.error ?? 'Upload failed.' })
    }
  }

  return (
    <div className="border border-zinc-700 rounded-lg p-5 bg-zinc-900/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-100">
          Editing Round #{round.number} — {round.title}
        </h3>
        <Button variant="secondary" className="text-xs px-2 py-1" onClick={onClose}>
          Close
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id={`edit-title-${round.id}`} label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input id={`edit-tagline-${round.id}`} label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
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
          <Input id={`edit-opens-${round.id}`} label="Opens at" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} required />
          <Input id={`edit-closes-${round.id}`} label="Closes at" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} required />
        </div>

        <Textarea
          id={`edit-description-${round.id}`}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          hint="Supports markdown"
        />

        {message && (
          <p className={message.type === 'success' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>

      {seasonNumber != null && (
        <div className="border-t border-zinc-800 mt-4 pt-4 space-y-2">
          <h4 className="text-sm font-medium text-zinc-400">Upload round data</h4>
          <input
            type="file"
            accept=".csv,.json,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
            className="text-sm text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-100 hover:file:bg-zinc-700 file:cursor-pointer"
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-zinc-500">Uploading...</p>}
          {uploadResult && (
            <p className={uploadResult.type === 'success' ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>
              {uploadResult.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DeleteRoundButton({ round }: { round: Round }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/rounds/${round.id}`, { method: 'DELETE' })
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
        <span className="text-xs text-amber-400">Delete #{round.number}?</span>
        <Button variant="primary" className="text-xs px-2 py-1" onClick={handleDelete} disabled={loading}>
          {loading ? '...' : 'Confirm'}
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
