'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, Mail, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function friendlyError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered')) return 'That email already has an account. Try logging in instead.'
  if (lower.includes('password')) return 'Use a password with at least 6 characters.'
  if (lower.includes('email')) return 'Enter a valid email address.'
  if (lower.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (lower.includes('provider')) return 'Google login is not configured for this project yet.'
  return 'We could not complete that request. Check your details and try again.'
}

function AuthContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/generate'
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Use a password with at least 6 characters.'); return }
    setBusy(true)
    const supabase = createClient()
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (result.error) { setError(friendlyError(result.error.message)); return }
    if (mode === 'signup' && !result.data.session) { setMessage('Check your inbox for a verification link. Once confirmed, log in to continue.'); return }
    window.location.href = next
  }

  async function continueWithGoogle() {
    setError('')
    const { error: oauthError } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })
    if (oauthError) setError(friendlyError(oauthError.message))
  }

  return <main className="min-h-screen bg-[#111b24] px-5 py-6 text-white sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-10 lg:min-h-[calc(100vh-48px)] lg:flex-row lg:items-center lg:justify-between lg:gap-20"><div className="max-w-xl"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-[#e9ff65]"><ArrowLeft className="size-4" /> Back to SideQuest</Link><div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#e9ff65] text-[#111b24]"><Zap className="size-6 fill-current" /></div><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#e9ff65]">Your next story starts here</p><h1 className="font-display max-w-lg text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-7xl">MAKE BOREDOM<br/><span className="text-[#e9ff65]">A LITTLE</span><br/>LESS BORING.</h1><p className="mt-6 max-w-md text-base leading-7 text-white/60">Create your SideQuest account to generate missions, save plans and keep your best ideas in one place.</p></div><section className="w-full max-w-md rounded-[28px] bg-white p-6 text-[#111b24] shadow-[0_25px_80px_rgba(0,0,0,.25)] sm:p-8" aria-labelledby="auth-heading"><div className="mb-7"><p className="mb-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#788a39]">{mode === 'signup' ? 'New here?' : 'Welcome back'}</p><h2 id="auth-heading" className="font-display text-3xl font-black tracking-[-.05em]">{mode === 'signup' ? 'Create your account' : 'Log in to SideQuest'}</h2></div><button type="button" onClick={continueWithGoogle} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#dce4e5] text-sm font-extrabold transition hover:border-[#111b24] hover:bg-[#f7f9f8]">Continue with Google <ArrowRight className="size-4" /></button><div className="my-6 flex items-center gap-3 text-xs font-bold text-[#9aa6aa]"><span className="h-px flex-1 bg-[#dce4e5]"/>OR<span className="h-px flex-1 bg-[#dce4e5]"/></div><form onSubmit={submit} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-extrabold uppercase tracking-wider text-[#53636a]">Email<div className="relative"><Mail className="absolute left-3 top-3.5 size-4 text-[#829097]"/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#111b24] focus:ring-2 focus:ring-[#e9ff65]" placeholder="you@example.com"/></div></label><label className="flex flex-col gap-2 text-xs font-extrabold uppercase tracking-wider text-[#53636a]">Password<div className="relative"><LockKeyhole className="absolute left-3 top-3.5 size-4 text-[#829097]"/><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#111b24] focus:ring-2 focus:ring-[#e9ff65]" placeholder="At least 6 characters"/></div></label>{mode === 'signup' && <label className="flex flex-col gap-2 text-xs font-extrabold uppercase tracking-wider text-[#53636a]">Confirm password<input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-semibold outline-none focus:border-[#111b24] focus:ring-2 focus:ring-[#e9ff65]" placeholder="Repeat your password"/></label>}{error && <p role="alert" className="rounded-xl bg-[#fff0ec] px-3 py-2 text-sm font-semibold text-[#a13a27]">{error}</p>}{message && <p role="status" className="rounded-xl bg-[#eef8d0] px-3 py-2 text-sm font-semibold text-[#425500]">{message}</p>}<button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111b24] text-sm font-extrabold text-white transition hover:bg-[#263943] disabled:opacity-60">{busy ? <><LoaderCircle className="size-4 animate-spin"/> Working…</> : mode === 'signup' ? 'Create account' : 'Log in'} <ArrowRight className="size-4"/></button></form><button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage('') }} className="mt-6 w-full text-center text-sm font-semibold text-[#6a777d] hover:text-[#111b24]">{mode === 'signup' ? 'Already have an account? Log in' : 'Need an account? Sign up'}</button></section></div></main>
}

export default function AuthPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#111b24]" aria-label="Loading authentication" />}><AuthContent /></Suspense>
}
