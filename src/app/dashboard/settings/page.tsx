'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameStatus, setNameStatus] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [pwStatus, setPwStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '')
        setDisplayName(data.user.user_metadata?.display_name ?? '')
      }
      setLoading(false)
    })
  }, [])

  async function updateName(e: React.FormEvent) {
    e.preventDefault()
    setNameStatus(null)
    if (displayName.length < 2 || displayName.length > 40) {
      setNameStatus('Name must be 2–40 characters.')
      return
    }
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    })
    if (error) {
      setNameStatus(error.message)
      return
    }
    // Also update profile table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
    }
    setNameStatus('Updated.')
  }

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailStatus(null)
    const { error } = await supabase.auth.updateUser({ email })
    if (error) {
      setEmailStatus(error.message)
      return
    }
    setEmailStatus('Confirmation email sent to your new address.')
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwStatus(null)
    if (newPassword.length < 8) {
      setPwStatus('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwStatus('Passwords do not match.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwStatus(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPwStatus('Password updated.')
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-zinc-100">Settings</h1>
        <a href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">← Back to dashboard</a>
      </div>

      {/* Display name */}
      <form onSubmit={updateName} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Display name</h2>
        <Input
          id="display_name"
          label=""
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={40}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Update name</Button>
          {nameStatus && (
            <p className={`text-xs ${nameStatus === 'Updated.' ? 'text-emerald-400' : 'text-red-400'}`}>
              {nameStatus}
            </p>
          )}
        </div>
      </form>

      <hr className="border-zinc-800" />

      {/* Email */}
      <form onSubmit={updateEmail} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Email</h2>
        <Input
          id="email"
          label=""
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Update email</Button>
          {emailStatus && (
            <p className={`text-xs ${emailStatus.includes('Confirmation') ? 'text-emerald-400' : 'text-red-400'}`}>
              {emailStatus}
            </p>
          )}
        </div>
      </form>

      <hr className="border-zinc-800" />

      {/* Password */}
      <form onSubmit={updatePassword} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Password</h2>
        <Input
          id="new_password"
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
        />
        <Input
          id="confirm_password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Update password</Button>
          {pwStatus && (
            <p className={`text-xs ${pwStatus === 'Password updated.' ? 'text-emerald-400' : 'text-red-400'}`}>
              {pwStatus}
            </p>
          )}
        </div>
      </form>

      <hr className="border-zinc-800" />

      {/* Account */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-400">Account</h2>
        <p className="text-xs text-zinc-600">
          To delete your account, contact{' '}
          <a href="mailto:hello@inferenc.me" className="text-zinc-400 hover:text-zinc-300">hello@inferenc.me</a>.
        </p>
      </div>
    </div>
  )
}
