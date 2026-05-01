'use client'

import { useEffect, useState } from 'react'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function timeLeft(target: string): { d: number; h: number; m: number; s: number } | null {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

export function Countdown({ target, label }: { target: string; label?: string }) {
  const [remaining, setRemaining] = useState(timeLeft(target))

  useEffect(() => {
    const id = setInterval(() => {
      const t = timeLeft(target)
      setRemaining(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!remaining) return null

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-xs text-zinc-500">{label}</p>}
      <div className="flex items-center gap-3 font-mono text-sm text-zinc-300">
        <span className="flex flex-col items-center">
          <span className="text-lg text-zinc-100">{remaining.d}</span>
          <span className="text-[10px] text-zinc-600 uppercase">days</span>
        </span>
        <span className="text-zinc-600">:</span>
        <span className="flex flex-col items-center">
          <span className="text-lg text-zinc-100">{pad(remaining.h)}</span>
          <span className="text-[10px] text-zinc-600 uppercase">hrs</span>
        </span>
        <span className="text-zinc-600">:</span>
        <span className="flex flex-col items-center">
          <span className="text-lg text-zinc-100">{pad(remaining.m)}</span>
          <span className="text-[10px] text-zinc-600 uppercase">min</span>
        </span>
        <span className="text-zinc-600">:</span>
        <span className="flex flex-col items-center">
          <span className="text-lg text-zinc-100">{pad(remaining.s)}</span>
          <span className="text-[10px] text-zinc-600 uppercase">sec</span>
        </span>
      </div>
    </div>
  )
}
