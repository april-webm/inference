'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    let res: Response
    try {
      res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
    } catch {
      setLoading(false)
      setError('Network error. Try again.')
      return
    }

    const json = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Signup failed.')
      return
    }
    router.push('/auth/check-email')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-zinc-100">Create an account</h1>
      <Input
        id="display_name"
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        minLength={2}
        maxLength={40}
        required
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Sign up'}
      </Button>
      <p className="text-xs text-zinc-500 text-center">
        Already have an account?{' '}
        <a href="/auth/login" className="text-amber-400 hover:text-amber-300">Log in</a>
      </p>
    </form>
  )
}
