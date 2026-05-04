'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

export default function AdminEmailsPage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSend(test: boolean) {
    setSending(true)
    setResult(null)

    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        body,
        testEmail: test ? testEmail : undefined,
      }),
    })

    const data = await res.json()
    setSending(false)
    setResult(res.ok ? `Sent to ${data.count} recipient(s).` : `Error: ${data.error}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium text-zinc-100 mb-6">Send Email</h1>

      <div className="flex flex-col gap-4">
        <Input
          id="subject"
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Important update about Round 2"
        />

        <Textarea
          id="body"
          label="Body (HTML)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder="<p>Hi there,</p><p>We wanted to let you know...</p>"
        />

        <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
          <Input
            id="testEmail"
            label="Test email address"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleSend(true)}
              disabled={sending || !subject || !body || !testEmail}
            >
              {sending ? 'Sending...' : 'Send test'}
            </Button>
            <Button
              onClick={() => handleSend(false)}
              disabled={sending || !subject || !body}
            >
              {sending ? 'Sending...' : 'Send to all'}
            </Button>
          </div>
        </div>

        {result && (
          <p className={`text-sm ${result.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {result}
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-600 mt-6">
        Recurring round emails (open, close, scores) are handled by GitHub Actions cron.
        Use this page for ad-hoc announcements.
      </p>
    </div>
  )
}
