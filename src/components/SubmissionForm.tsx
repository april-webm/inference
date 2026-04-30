'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface SubmissionFormProps {
  roundId: string
  closesAt: string
  existingAnswer?: Record<string, unknown> | null
  existingReasoning?: string | null
}

export function SubmissionForm({
  roundId,
  closesAt,
  existingAnswer,
  existingReasoning,
}: SubmissionFormProps) {
  const isClosed = new Date(closesAt) <= new Date()

  const [answerText, setAnswerText] = useState(
    existingAnswer ? JSON.stringify(existingAnswer, null, 2) : ''
  )
  const [reasoning, setReasoning] = useState(existingReasoning ?? '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (isClosed) {
    return (
      <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 text-sm text-zinc-400">
        Submissions for this round are now closed.
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (reasoning.length < 50) {
      setStatus('error')
      setErrorMessage('Reasoning must be at least 50 characters.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, answer: answerText, reasoning }),
      })

      if (res.status === 429) {
        setStatus('error')
        setErrorMessage('Daily submission limit reached (5 per day). Try again tomorrow.')
        return
      }

      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(json.error ?? 'Something went wrong.')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Try again.')
    }
  }

  const hasExisting = existingAnswer != null
  const buttonLabel = status === 'loading'
    ? 'Submitting...'
    : hasExisting
    ? 'Update answer'
    : 'Submit answer'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Textarea
        id="answer"
        label="Your answer"
        hint="Enter your answer as JSON. Format is specified in the problem statement above."
        rows={8}
        className="font-mono"
        placeholder={'{\n  "bid": 142.50\n}'}
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        required
      />
      <Textarea
        id="reasoning"
        label="Reasoning"
        hint="Explain your approach. Minimum 50 characters."
        rows={5}
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        required
      />
      <p className="text-xs text-zinc-500 -mt-2">{reasoning.length} / 50 minimum</p>
      <div>
        <Button type="submit" disabled={status === 'loading'}>{buttonLabel}</Button>
      </div>
      {status === 'success' && (
        <p className="text-xs text-emerald-400">Submission recorded.</p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-400">{errorMessage}</p>
      )}
    </form>
  )
}
