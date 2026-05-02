'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface SubmissionFormProps {
  roundId: string
  roundNumber: number
  closesAt: string
  existingAnswer?: Record<string, unknown> | null
  existingReasoning?: string | null
  submissionsRemaining: number
}

const ROUND_1_HORSES = [
  'Shadowfax', 'Iron Duke', 'Morningstar', 'Red Tide',
  'Gallant Fox', 'Blue Streak', 'Copper Prince', 'Last Chance',
]

const ROUND_2_SIGNALS = Array.from({ length: 21 }, (_, i) => i * 50)

const ROUND_3_INSTRUMENTS = [
  'underlying',
  'call_10000', 'call_30000', 'call_60000', 'call_120000',
  'call_150000', 'call_180000', 'call_240000',
  'put_10000', 'put_30000', 'put_60000', 'put_120000',
  'put_150000', 'put_180000', 'put_240000', 'put_480000', 'put_1000000',
]

function formatInstrument(key: string): string {
  if (key === 'underlying') return 'Underlying'
  const [type, strike] = key.split('_')
  return `${type === 'call' ? 'Call' : 'Put'} $${Number(strike).toLocaleString()}`
}

export function SubmissionForm({
  roundId,
  roundNumber,
  closesAt,
  existingAnswer,
  existingReasoning,
  submissionsRemaining,
}: SubmissionFormProps) {
  const isClosed = new Date(closesAt) <= new Date()
  const noneLeft = submissionsRemaining <= 0

  const [reasoning, setReasoning] = useState(existingReasoning ?? '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Round-specific state
  const [r1Stakes, setR1Stakes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const h of ROUND_1_HORSES) {
      init[h] = existingAnswer?.[h] != null ? String(existingAnswer[h]) : ''
    }
    return init
  })

  const [r2Strategy, setR2Strategy] = useState<{ bid: string; ask: string }[]>(() =>
    ROUND_2_SIGNALS.map((s, i) => {
      const existing = (existingAnswer as { strategy?: { bid: number; ask: number }[] } | null)?.strategy?.[i]
      return {
        bid: existing?.bid != null ? String(existing.bid) : '',
        ask: existing?.ask != null ? String(existing.ask) : '',
      }
    })
  )

  const [r3Allocs, setR3Allocs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const k of ROUND_3_INSTRUMENTS) {
      init[k] = existingAnswer?.[k] != null ? String(existingAnswer[k]) : ''
    }
    return init
  })

  // Raw JSON fallback for unknown rounds
  const [rawJson, setRawJson] = useState(
    existingAnswer ? JSON.stringify(existingAnswer, null, 2) : ''
  )

  if (isClosed) {
    return (
      <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 text-sm text-zinc-400">
        Submissions for this round are now closed.
      </div>
    )
  }

  if (noneLeft) {
    return (
      <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 text-sm text-zinc-400">
        You have used all 3 submissions for this round. Your latest one is the one we score.
      </div>
    )
  }

  function buildAnswer(): string {
    if (roundNumber === 1) {
      const obj: Record<string, number> = {}
      for (const h of ROUND_1_HORSES) {
        obj[h] = parseFloat(r1Stakes[h]) || 0
      }
      return JSON.stringify(obj)
    }
    if (roundNumber === 2) {
      const strategy = ROUND_2_SIGNALS.map((s, i) => ({
        signal: s,
        bid: parseFloat(r2Strategy[i].bid) || 0,
        ask: parseFloat(r2Strategy[i].ask) || 0,
      }))
      return JSON.stringify({ strategy })
    }
    if (roundNumber === 3) {
      const obj: Record<string, number> = {}
      for (const k of ROUND_3_INSTRUMENTS) {
        obj[k] = parseFloat(r3Allocs[k]) || 0
      }
      return JSON.stringify(obj)
    }
    return rawJson
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (reasoning.length < 50) {
      setStatus('error')
      setErrorMessage('Reasoning must be at least 50 characters.')
      return
    }

    const answerText = buildAnswer()

    setStatus('loading')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, answer: answerText, reasoning }),
      })

      if (res.status === 429) {
        setStatus('error')
        setErrorMessage('Daily submission limit reached. Try again tomorrow.')
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <h2 className="text-sm font-medium text-zinc-100">Your answer</h2>

      {/* Round 1: horse stakes */}
      {roundNumber === 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500">Stake on each horse (£). Must sum to at most £10,000.</p>
          <div className="grid grid-cols-2 gap-3">
            {ROUND_1_HORSES.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <label className="text-sm text-zinc-400 w-32 shrink-0">{h}</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={r1Stakes[h]}
                  onChange={(e) => setR1Stakes({ ...r1Stakes, [h]: e.target.value })}
                  placeholder="0"
                  className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors w-full"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            Total: £{ROUND_1_HORSES.reduce((s, h) => s + (parseFloat(r1Stakes[h]) || 0), 0).toFixed(2)}
          </p>
        </div>
      )}

      {/* Round 2: strategy table */}
      {roundNumber === 2 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500">For each signal value, set your bid and ask. 0 ≤ bid ≤ ask ≤ 1200.</p>
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                <tr>
                  <th className="py-2 px-3 text-left w-20">Signal</th>
                  <th className="py-2 px-3 text-left">Bid</th>
                  <th className="py-2 px-3 text-left">Ask</th>
                </tr>
              </thead>
              <tbody>
                {ROUND_2_SIGNALS.map((s, i) => (
                  <tr key={s} className="border-t border-zinc-800">
                    <td className="py-1.5 px-3 font-mono text-zinc-400">{s}</td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        min="0"
                        max="1200"
                        step="any"
                        value={r2Strategy[i].bid}
                        onChange={(e) => {
                          const next = [...r2Strategy]
                          next[i] = { ...next[i], bid: e.target.value }
                          setR2Strategy(next)
                        }}
                        placeholder="0"
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 w-24"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        min="0"
                        max="1200"
                        step="any"
                        value={r2Strategy[i].ask}
                        onChange={(e) => {
                          const next = [...r2Strategy]
                          next[i] = { ...next[i], ask: e.target.value }
                          setR2Strategy(next)
                        }}
                        placeholder="0"
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 w-24"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Round 3: instrument allocations */}
      {roundNumber === 3 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500">Allocation per instrument (% of portfolio). Positive = buy, negative = sell. Gross ≤ 200%.</p>
          <div className="grid grid-cols-2 gap-3">
            {ROUND_3_INSTRUMENTS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <label className="text-sm text-zinc-400 w-32 shrink-0">{formatInstrument(k)}</label>
                <input
                  type="number"
                  step="any"
                  value={r3Allocs[k]}
                  onChange={(e) => setR3Allocs({ ...r3Allocs, [k]: e.target.value })}
                  placeholder="0"
                  className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors w-full"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            Gross: {ROUND_3_INSTRUMENTS.reduce((s, k) => s + Math.abs(parseFloat(r3Allocs[k]) || 0), 0).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Fallback: raw JSON */}
      {![1, 2, 3].includes(roundNumber) && (
        <Textarea
          id="answer"
          label="Your answer"
          hint="Enter your answer as JSON."
          rows={8}
          className="font-mono"
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          required
        />
      )}

      <Textarea
        id="reasoning"
        label="Reasoning"
        hint="Explain your approach. Minimum 50 characters."
        rows={5}
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        required
      />
      <p className="text-xs text-zinc-500 -mt-4">{reasoning.length} / 50 minimum</p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === 'loading'}>{buttonLabel}</Button>
        <p className="text-xs text-zinc-500">
          {submissionsRemaining} of 3 submissions left this round
        </p>
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
