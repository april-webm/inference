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

// Compute changed keys between two flat objects
function diffKeys(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown>
): Set<string> {
  const changed = new Set<string>()
  if (!oldObj) return new Set(Object.keys(newObj))
  for (const key of new Set([...Object.keys(oldObj), ...Object.keys(newObj)])) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changed.add(key)
    }
  }
  return changed
}

export function SubmissionForm({
  roundId,
  roundNumber,
  closesAt,
  existingAnswer,
  existingReasoning,
}: SubmissionFormProps) {
  const isClosed = new Date(closesAt) <= new Date()

  const [reasoning, setReasoning] = useState(existingReasoning ?? '')
  const [status, setStatus] = useState<'idle' | 'confirming' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)

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

  function handlePreSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (reasoning.length < 50) {
      setStatus('error')
      setErrorMessage('Reasoning must be at least 50 characters.')
      return
    }

    const answerText = buildAnswer()
    setPendingAnswer(answerText)
    setStatus('confirming')
  }

  async function handleConfirm() {
    if (!pendingAnswer) return
    setStatus('loading')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, answer: pendingAnswer, reasoning }),
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

  function handleCancel() {
    setPendingAnswer(null)
    setStatus('idle')
  }

  const hasExisting = existingAnswer != null

  // Confirmation screen
  if (status === 'confirming' && pendingAnswer) {
    const newAnswer = JSON.parse(pendingAnswer) as Record<string, unknown>

    return (
      <div className="flex flex-col gap-4 border border-zinc-700 bg-zinc-900/50 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-100">
          {hasExisting ? 'Confirm changes' : 'Confirm submission'}
        </h2>

        {hasExisting ? (
          <>
            <p className="text-xs text-zinc-500">
              Review your changes below.
            </p>
            <AnswerDiff
              oldAnswer={existingAnswer}
              newAnswer={newAnswer}
              roundNumber={roundNumber}
            />
            {existingReasoning !== reasoning && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-zinc-400">Reasoning changed</p>
                <div className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 max-h-32 overflow-y-auto">
                  <p className="text-red-400/70 line-through whitespace-pre-wrap">{existingReasoning}</p>
                  <p className="text-emerald-400/90 whitespace-pre-wrap mt-2">{reasoning}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-zinc-500">
            Are you sure you want to submit?
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleConfirm}>
            {hasExisting ? 'Confirm update' : 'Confirm submission'}
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const buttonLabel = status === 'loading'
    ? 'Submitting...'
    : hasExisting
    ? 'Update answer'
    : 'Submit answer'

  return (
    <form onSubmit={handlePreSubmit} className="flex flex-col gap-6">
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
          You can update your answer until the round closes.
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

// Diff component: shows changed fields between old and new answers
function AnswerDiff({
  oldAnswer,
  newAnswer,
  roundNumber,
}: {
  oldAnswer: Record<string, unknown> | null | undefined
  newAnswer: Record<string, unknown>
  roundNumber: number
}) {
  // For round 2, flatten strategy array for diffing
  if (roundNumber === 2) {
    const oldStrategy = (oldAnswer as { strategy?: { signal: number; bid: number; ask: number }[] } | null)?.strategy ?? []
    const newStrategy = (newAnswer as { strategy?: { signal: number; bid: number; ask: number }[] })?.strategy ?? []

    const changedRows: number[] = []
    for (let i = 0; i < Math.max(oldStrategy.length, newStrategy.length); i++) {
      const o = oldStrategy[i]
      const n = newStrategy[i]
      if (!o || !n || o.bid !== n.bid || o.ask !== n.ask) {
        changedRows.push(i)
      }
    }

    if (changedRows.length === 0) {
      return <p className="text-xs text-zinc-500">No changes to answer.</p>
    }

    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-zinc-400">
          Answer changes ({changedRows.length} signal{changedRows.length !== 1 ? 's' : ''} modified)
        </p>
        <div className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 max-h-48 overflow-y-auto font-mono">
          {changedRows.map((i) => {
            const o = oldStrategy[i]
            const n = newStrategy[i]
            const signal = n?.signal ?? o?.signal ?? i * 50
            return (
              <div key={i} className="flex gap-4 py-0.5">
                <span className="text-zinc-500 w-16">sig {signal}</span>
                <span className="text-red-400/70">bid {o?.bid ?? 0} ask {o?.ask ?? 0}</span>
                <span className="text-zinc-600">→</span>
                <span className="text-emerald-400/90">bid {n?.bid ?? 0} ask {n?.ask ?? 0}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // For rounds 1, 3, and fallback: flat key-value diff
  const changed = diffKeys(oldAnswer, newAnswer)

  if (changed.size === 0) {
    return <p className="text-xs text-zinc-500">No changes to answer.</p>
  }

  const formatKey = roundNumber === 3 ? formatInstrument : (k: string) => k

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-zinc-400">
        Answer changes ({changed.size} field{changed.size !== 1 ? 's' : ''} modified)
      </p>
      <div className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 max-h-48 overflow-y-auto font-mono">
        {[...changed].map((key) => (
          <div key={key} className="flex gap-4 py-0.5">
            <span className="text-zinc-500 w-32 shrink-0">{formatKey(key)}</span>
            <span className="text-red-400/70">{JSON.stringify(oldAnswer?.[key] ?? 0)}</span>
            <span className="text-zinc-600">→</span>
            <span className="text-emerald-400/90">{JSON.stringify(newAnswer[key])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
