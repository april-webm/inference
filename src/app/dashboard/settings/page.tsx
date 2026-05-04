'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { COUNTRIES } from '@/lib/countries'

const WEBHOOK_EVENTS = [
  'season_open',
  'round_open',
  'round_24h_warning',
  'round_close',
  'scores_posted',
] as const

type Webhook = {
  id: string
  url: string
  events: string[]
  enabled: boolean
  created_at: string
}

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameStatus, setNameStatus] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [pwStatus, setPwStatus] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState('')
  const [countryStatus, setCountryStatus] = useState<string | null>(null)
  const [emailOptOut, setEmailOptOut] = useState(false)
  const [emailPrefStatus, setEmailPrefStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([...WEBHOOK_EVENTS])
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    const res = await fetch('/api/webhooks')
    if (res.ok) {
      const { webhooks: wh } = await res.json()
      setWebhooks(wh)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '')
        setDisplayName(data.user.user_metadata?.display_name ?? '')
        // Fetch profile preferences
        supabase.from('profiles').select('email_opt_out, country_code').eq('id', data.user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              setEmailOptOut(profile.email_opt_out ?? false)
              setCountryCode(profile.country_code ?? '')
            }
          })
      }
      setLoading(false)
    })
    fetchWebhooks()
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

  async function addWebhook(e: React.FormEvent) {
    e.preventDefault()
    setWebhookStatus(null)
    if (!webhookUrl.startsWith('https://')) {
      setWebhookStatus('URL must start with https://')
      return
    }
    if (webhookEvents.length === 0) {
      setWebhookStatus('Select at least one event.')
      return
    }
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      setWebhookStatus(error || 'Failed to add webhook.')
      return
    }
    setWebhookUrl('')
    setWebhookEvents([...WEBHOOK_EVENTS])
    setWebhookStatus('Webhook added.')
    fetchWebhooks()
  }

  async function toggleWebhook(id: string, enabled: boolean) {
    await fetch(`/api/webhooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    fetchWebhooks()
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchWebhooks()
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

      {/* Country */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Country</h2>
        <select
          value={countryCode}
          onChange={async (e) => {
            const code = e.target.value
            setCountryCode(code)
            setCountryStatus(null)
            const { data: { user: u } } = await supabase.auth.getUser()
            if (u) {
              await supabase.from('profiles').update({ country_code: code || null }).eq('id', u.id)
              setCountryStatus('Updated.')
            }
          }}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="">No country selected</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {countryStatus && (
          <p className="text-xs text-emerald-400">{countryStatus}</p>
        )}
      </div>

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

      {/* Email notifications */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Email notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!emailOptOut}
            onChange={async (e) => {
              const optOut = !e.target.checked
              setEmailOptOut(optOut)
              setEmailPrefStatus(null)
              const { data: { user: u } } = await supabase.auth.getUser()
              if (u) {
                await supabase.from('profiles').update({ email_opt_out: optOut }).eq('id', u.id)
                setEmailPrefStatus(optOut ? 'Unsubscribed.' : 'Subscribed.')
              }
            }}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
          />
          <span className="text-sm text-zinc-300">
            Receive round notifications and score updates
          </span>
        </label>
        {emailPrefStatus && (
          <p className="text-xs text-emerald-400">{emailPrefStatus}</p>
        )}
      </div>

      <hr className="border-zinc-800" />

      {/* Webhooks */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-400">Webhooks</h2>
        <p className="text-xs text-zinc-500">
          Receive Discord/webhook notifications for competition events.
        </p>

        {webhooks.length > 0 && (
          <div className="flex flex-col gap-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between gap-3 rounded border border-zinc-800 p-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm text-zinc-200 truncate" title={wh.url}>
                    {wh.url.length > 50 ? wh.url.slice(0, 50) + '...' : wh.url}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev) => (
                      <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleWebhook(wh.id, !wh.enabled)}
                    className={`text-xs px-2 py-1 rounded ${wh.enabled ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    {wh.enabled ? 'On' : 'Off'}
                  </button>
                  {deletingId === wh.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteWebhook(wh.id)} className="text-xs text-red-400 hover:text-red-300">
                        Confirm
                      </button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(wh.id)} className="text-xs text-zinc-500 hover:text-red-400">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addWebhook} className="flex flex-col gap-3 mt-2">
          <Input
            id="webhook_url"
            label="Webhook URL"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
          />
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.includes(ev)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWebhookEvents([...webhookEvents, ev])
                    } else {
                      setWebhookEvents(webhookEvents.filter((x) => x !== ev))
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-400">{ev}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Add webhook</Button>
            {webhookStatus && (
              <p className={`text-xs ${webhookStatus === 'Webhook added.' ? 'text-emerald-400' : 'text-red-400'}`}>
                {webhookStatus}
              </p>
            )}
          </div>
        </form>
      </div>

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
