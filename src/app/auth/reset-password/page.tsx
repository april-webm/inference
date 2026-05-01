'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser()
      .then(({ data }) => setHasSession(!!data.user))
      .catch(() => setHasSession(false))
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  if (hasSession === null) {
    return <p className="text-sm text-zinc-500 text-center">Loading...</p>
  }

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-lg font-medium text-zinc-100">Link expired</h1>
        <p className="text-sm text-zinc-400">
          This reset link is invalid or has expired. Request a new one.
        </p>
        <p className="text-xs text-zinc-500">
          <a href="/auth/forgot-password" className="text-amber-400 hover:text-amber-300">
            Request a new link
          </a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-zinc-100">Choose a new password</h1>
      <Input
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <Input
        id="confirm"
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        minLength={8}
        required
      />
      {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update password'}
      </Button>
    </form>
  )
}
