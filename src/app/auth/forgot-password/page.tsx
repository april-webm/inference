'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    const supabase = createSupabaseBrowserClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-lg font-medium text-zinc-100">Check your inbox</h1>
        <p className="text-sm text-zinc-400">
          If an account exists for that email, we sent a password reset link.
        </p>
        <p className="text-xs text-zinc-500">
          <a href="/auth/login" className="text-amber-400 hover:text-amber-300">Back to login</a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-zinc-100">Reset your password</h1>
      <p className="text-xs text-zinc-500">
        Enter your account email and we will send you a reset link.
      </p>
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending...' : 'Send reset link'}
      </Button>
      <p className="text-xs text-zinc-500 text-center">
        <a href="/auth/login" className="text-amber-400 hover:text-amber-300">Back to login</a>
      </p>
    </form>
  )
}
