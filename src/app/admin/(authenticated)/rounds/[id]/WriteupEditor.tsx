'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Markdown } from '@/components/Markdown'

export function WriteupEditor({
  roundId,
  initialWriteup,
}: {
  roundId: string
  initialWriteup: string | null
}) {
  const [writeup, setWriteup] = useState(initialWriteup ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const res = await fetch(`/api/admin/rounds/${roundId}/writeup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ writeup }),
    })

    setSaving(false)

    if (res.ok) {
      setMessage({ type: 'success', text: 'Writeup saved.' })
    } else {
      const body = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: body.error ?? 'Failed to save.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Textarea
            id="writeup-editor"
            label="Writeup (Markdown)"
            value={writeup}
            onChange={(e) => setWriteup(e.target.value)}
            rows={20}
            hint="Write the official solution writeup for this round"
          />
        </div>
        <div className="border border-zinc-800 rounded p-4 overflow-y-auto max-h-[520px]">
          <p className="text-xs text-zinc-500 mb-2">Preview</p>
          {writeup ? (
            <Markdown>{writeup}</Markdown>
          ) : (
            <p className="text-sm text-zinc-600 italic">Nothing to preview</p>
          )}
        </div>
      </div>

      {message && (
        <p className={message.type === 'success' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save writeup'}
      </Button>
    </div>
  )
}
