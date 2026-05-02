'use client'

import { useState } from 'react'

export function ShareProfileButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/profile/${userId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
    >
      {copied ? 'Copied!' : 'Share profile'}
    </button>
  )
}
