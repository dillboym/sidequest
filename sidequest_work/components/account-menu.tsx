'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ChevronDown, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/supabase/safe'

export function AccountMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setError("We're having trouble restoring your session."), 5000)
    try {
      const { data } = createClient().auth.onAuthStateChange((_event, session) => {
        window.clearTimeout(timer)
        setUser(session?.user ?? null)
        setError('')
      })
      return () => { window.clearTimeout(timer); data.subscription.unsubscribe() }
    } catch {
      window.clearTimeout(timer)
      setError("We're having trouble restoring your session.")
    }
  }, [])

  async function retry() {
    setBusy(true)
    try {
      const { data, error } = await withTimeout(createClient().auth.getSession(), 5000, 'Session check timed out')
      if (error) throw error
      setUser(data.session?.user ?? null)
      setError('')
    } catch { setError("We're having trouble restoring your session.") }
    finally { setBusy(false) }
  }

  async function signOut() {
    setBusy(true)
    try {
      const { error } = await withTimeout(createClient().auth.signOut(), 12000, 'Logout timed out')
      if (error) throw error
      window.location.assign('/')
    } catch { setError('Could not log out. Try again.'); setBusy(false) }
  }

  const name = String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer')
  const initials = name.split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase()
  return <div className="relative">
    {user ? <details className="group" onKeyDown={event => { if (event.key === 'Escape') event.currentTarget.open = false }}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-white/20 px-2 py-1 text-white focus-visible:outline-2 focus-visible:outline-[#e9ff65]" aria-label="Account menu">
        <span className="grid size-8 place-items-center rounded-full bg-[#e9ff65] text-xs font-black text-[#111b24]">{initials}</span><ChevronDown className="size-4" />
      </summary>
      <nav aria-label="Account" className="absolute right-0 top-14 flex w-60 flex-col gap-1 rounded-2xl border border-white/15 bg-[#111b24] p-3 text-sm text-white shadow-xl">
        <p className="truncate border-b border-white/10 px-3 py-3 font-bold">{name}</p>
        {[['/profile','My Account'],['/profile#history','Previous SideQuests'],['/saved','Saved'],['/profile#preferences','Preferences']].map(([href,label]) => <Link key={href} href={href} className="rounded-lg px-3 py-3 hover:bg-white/10">{label}</Link>)}
        <button disabled={busy} onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-[#e9ff65] hover:bg-white/10"><LogOut className="size-4" />{busy ? 'Please wait…' : 'Log out'}</button>
      </nav>
    </details> : <Link href="/auth" className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm font-bold text-white">Sign in</Link>}
    {error && <div role="status" className="absolute right-0 top-14 w-64 rounded-2xl border border-white/15 bg-[#111b24] p-4 text-sm text-white shadow-xl"><p>{error}</p><div className="mt-3 flex gap-4"><button onClick={retry} disabled={busy} className="min-h-11 font-bold text-[#e9ff65]">Try again</button><Link href="/auth" className="inline-flex min-h-11 items-center underline">Log in</Link></div></div>}
  </div>
}
