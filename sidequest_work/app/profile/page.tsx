'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bookmark, CircleUserRound, History, LoaderCircle, LogOut, Save, Sparkles, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/supabase/safe'

type Profile = { display_name: string | null; avatar_url: string | null; home_city: string | null; preferred_transport: string | null; typical_budget: number | null; walking_distance: number | null }
type QuestRow = { id: string; title: string; area: string; budget: number; time_minutes: number; vibes: string[]; created_at: string }

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile>({ display_name: '', avatar_url: null, home_city: 'London', preferred_transport: 'best', typical_budget: 20, walking_distance: 30 })
  const [quests, setQuests] = useState<QuestRow[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const supabase = createClient()
      const session = await withTimeout(supabase.auth.getSession(), 3000, 'Login check timed out')
      const user = session.data.session?.user
      if (!user) {
        router.replace('/auth?next=/profile')
        return
      }

      setEmail(user.email ?? '')

      const results = await withTimeout(
        Promise.all([
          supabase.from('profiles').select('display_name,avatar_url,home_city,preferred_transport,typical_budget,walking_distance').eq('id', user.id).maybeSingle(),
          supabase.from('quests').select('id,title,area,budget,time_minutes,vibes,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
          supabase.from('saved_quests').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('subscriptions').select('plan,quests_used').eq('user_id', user.id).maybeSingle(),
        ]),
        6000,
        'Account data took too long to load',
      )

      const [{ data: p }, { data: q }, { count }, { data: sub }] = results
      if (p) setProfile((current) => ({ ...current, ...p }))
      setQuests(q ?? [])
      setSavedCount(count ?? 0)
      if (sub) setFreeRemaining(sub.plan === 'free' ? Math.max(0, 1 - (sub.quests_used ?? 0)) : null)
    } catch {
      setMessage('Account data could not load right now. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      const session = await withTimeout(supabase.auth.getSession(), 3000, 'Login check timed out')
      const user = session.data.session?.user
      if (!user) {
        router.push('/auth?next=/profile')
        return
      }
      const result = await withTimeout(
        supabase.from('profiles').upsert({ id: user.id, ...profile, home_city: 'London', updated_at: new Date().toISOString() }),
        5000,
        'Saving profile took too long',
      )
      setMessage(result.error ? 'Could not save your profile yet.' : 'Profile saved.')
    } catch {
      setMessage('Could not save your profile yet.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#111b24] text-white"><LoaderCircle className="size-8 animate-spin text-[#e9ff65]" /></main>

  return <main className="min-h-screen bg-[#f7f9f8] pb-20 text-[#111b24]">
    <header className="bg-[#111b24] px-5 py-6 text-white lg:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="flex items-center gap-2 font-black"><span className="grid size-9 place-items-center rounded-xl bg-[#e9ff65] text-[#111b24]"><Zap className="size-5 fill-current" /></span>SIDEQUEST</Link><div className="flex gap-2"><Link href="/generate" className="rounded-full bg-[#e9ff65] px-4 py-2 text-sm font-black text-[#111b24]">Generate</Link><button onClick={signOut} className="grid size-10 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white" aria-label="Log out"><LogOut className="size-4"/></button></div></div></header>
    <div className="mx-auto max-w-7xl px-5 pt-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 rounded-[30px] bg-[#111b24] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-[#e9ff65] text-[#111b24]"><CircleUserRound className="size-7"/></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#e9ff65]">Account centre</p><h1 className="mt-1 font-display text-3xl font-black tracking-[-.05em]">{profile.display_name || email.split('@')[0] || 'Your profile'}</h1><p className="mt-1 text-sm text-white/55">{email}</p></div></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-white/5 px-4 py-3"><p className="text-xl font-black text-[#e9ff65]">{freeRemaining ?? '∞'}</p><p className="text-[10px] uppercase text-white/45">Free quests</p></div><div className="rounded-2xl bg-white/5 px-4 py-3"><p className="text-xl font-black">{quests.length}</p><p className="text-[10px] uppercase text-white/45">Recent</p></div><div className="rounded-2xl bg-white/5 px-4 py-3"><p className="text-xl font-black">{savedCount}</p><p className="text-[10px] uppercase text-white/45">Saved</p></div></div></div>

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-3xl border border-[#dce4e5] bg-white p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-[#788a39]">Profile & preferences</p><div className="mt-5 grid gap-4"><label className="text-xs font-black uppercase tracking-wider text-[#53636a]">Display name<input value={profile.display_name ?? ''} onChange={e=>setProfile({...profile,display_name:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-semibold outline-none focus:border-[#111b24]"/></label><label className="text-xs font-black uppercase tracking-wider text-[#53636a]">City<div className="mt-2 flex h-11 items-center rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-black">London <span className="ml-auto text-[10px] text-[#788a39]">CURRENT CITY</span></div></label><label className="text-xs font-black uppercase tracking-wider text-[#53636a]">Typical budget (£ per person)<input type="number" min="0" value={profile.typical_budget ?? 20} onChange={e=>setProfile({...profile,typical_budget:Number(e.target.value)})} className="mt-2 h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-semibold outline-none focus:border-[#111b24]"/></label><label className="text-xs font-black uppercase tracking-wider text-[#53636a]">Preferred transport<select value={profile.preferred_transport ?? 'best'} onChange={e=>setProfile({...profile,preferred_transport:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-semibold"><option value="best">Best option</option><option value="walk">Walking</option><option value="bike">Bike</option><option value="transit">Tube / bus</option></select></label><label className="text-xs font-black uppercase tracking-wider text-[#53636a]">Comfortable walking (minutes)<input type="number" min="5" max="120" value={profile.walking_distance ?? 30} onChange={e=>setProfile({...profile,walking_distance:Number(e.target.value)})} className="mt-2 h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-3 text-sm font-semibold"/></label></div>{message && <p className="mt-4 text-sm font-bold text-[#788a39]">{message}</p>}<button onClick={saveProfile} disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#111b24] text-sm font-black text-white"><Save className="size-4"/>{saving?'Saving…':'Save profile'}</button></section>

        <section className="rounded-3xl border border-[#dce4e5] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#788a39]">Previous SideQuests</p><h2 className="mt-1 font-display text-2xl font-black tracking-[-.04em]">Your recent missions</h2></div><History className="size-5 text-[#788a39]"/></div>{quests.length ? <div className="mt-5 grid gap-3">{quests.map(q=><div key={q.id} className="rounded-2xl border border-[#dce4e5] bg-[#f7f9f8] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{q.title}</h3><p className="mt-1 text-sm text-[#6a777d]">{q.area} · £{q.budget} PP · {q.time_minutes} min</p><div className="mt-2 flex flex-wrap gap-1.5">{(q.vibes??[]).map(v=><span key={v} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#53636a]">{v}</span>)}</div></div><span className="text-[10px] font-bold text-[#829097]">{new Date(q.created_at).toLocaleDateString()}</span></div></div>)}</div> : <div className="mt-5 rounded-2xl bg-[#f7f9f8] p-6 text-center"><Sparkles className="mx-auto size-6 text-[#788a39]"/><p className="mt-3 text-sm font-bold">No SideQuests yet.</p><Link href="/generate" className="mt-3 inline-flex items-center gap-2 text-sm font-black underline">Create your first <ArrowRight className="size-4"/></Link></div>}<div className="mt-5 grid grid-cols-2 gap-3"><Link href="/saved" className="flex items-center justify-center gap-2 rounded-xl border border-[#dce4e5] px-4 py-3 text-sm font-black"><Bookmark className="size-4"/>Saved</Link><Link href="/generate" className="flex items-center justify-center gap-2 rounded-xl bg-[#e9ff65] px-4 py-3 text-sm font-black">New SideQuest<ArrowRight className="size-4"/></Link></div></section>
      </div>
    </div>
  </main>
}
