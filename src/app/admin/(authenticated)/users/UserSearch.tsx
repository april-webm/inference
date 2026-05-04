'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function UserSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')

  function submit(value: string) {
    const current = new URLSearchParams(params.toString())
    if (value.trim()) {
      current.set('q', value.trim())
    } else {
      current.delete('q')
    }
    const qs = current.toString()
    router.push(`/admin/users${qs ? `?${qs}` : ''}`)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(query)
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 pr-8 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors w-64"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            submit('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-400 text-xs leading-none transition-colors"
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </form>
  )
}
