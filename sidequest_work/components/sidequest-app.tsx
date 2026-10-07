'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Compass,
  Crosshair,
  Footprints,
  Heart,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Menu,
  Navigation,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  Timer,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  BUDGET_OPTIONS,
  CITIES,
  COMPLETED_QUEST_EXAMPLE,
  LONDON_AREAS,
  INTENT_CATEGORIES,
  PEOPLE_OPTIONS,
  TIME_OPTIONS,
  TRENDING_QUESTS,
  VIBE_CATEGORIES,
  type Activity,
  type Quest,
} from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
const LiveMap = dynamic(() => import('@/components/live-map'), { ssr: false })

const navItems = [
  { href: '/explore', label: 'Explore' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/saved', label: 'Saved' },
  { href: '/profile', label: 'Account' },
]

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="SideQuest home">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e9ff65] text-[#111b24] transition-transform group-hover:rotate-6">
        <Zap className="size-5 fill-current" />
      </span>
      <span className="font-display text-lg font-black tracking-[-0.06em] text-white">SIDEQUEST</span>
    </Link>
  )
}

function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#111b24]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn('text-sm font-semibold transition-colors hover:text-[#e9ff65]', pathname === item.href ? 'text-[#e9ff65]' : 'text-white/65')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/generate" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#e9ff65] px-5 text-sm font-extrabold text-[#111b24] transition-all hover:-translate-y-0.5 hover:bg-white">
            Generate <ArrowRight className="size-4" />
          </Link>
          <Link href="/profile" className="grid size-10 place-items-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-[#e9ff65] hover:text-[#e9ff65]" aria-label="Profile">
            <CircleUserRound className="size-5" />
          </Link>
        </div>
        <button className="grid size-10 place-items-center text-white md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 bg-[#111b24] px-5 py-5 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-[#e9ff65]">{item.label}</Link>)}
            <Link href="/generate" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#e9ff65] py-3 text-sm font-extrabold text-[#111b24]">Generate <ArrowRight className="size-4" /></Link>
          </div>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return <footer className="border-t border-[#dce4e5] bg-white px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><Logo /><p className="mt-3 text-sm text-[#6a777d]">Make the ordinary less ordinary.</p></div><div className="flex gap-5 text-sm text-[#6a777d]"><Link href="/how-it-works" className="hover:text-[#111b24]">How it works</Link><Link href="/explore" className="hover:text-[#111b24]">Explore</Link><Link href="/profile" className="hover:text-[#111b24]">Account</Link></div></div></footer>
}

function SelectionRow({ label, options, value, onChange, icon }: { label: string; options: { id: string; label: string; value: number }[]; value: string; onChange: (id: string) => void; icon: React.ReactNode }) {
  return <fieldset className="flex flex-col gap-3"><legend className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]">{icon}{label}</legend><div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">{options.map((option) => <button type="button" key={option.id} onClick={() => onChange(option.id)} className={cn('min-h-11 rounded-xl border px-3 text-sm font-bold transition-all', value === option.id ? 'border-[#111b24] bg-[#111b24] text-white shadow-[0_4px_0_#e9ff65]' : 'border-[#dce4e5] bg-white text-[#53636a] hover:-translate-y-0.5 hover:border-[#111b24] hover:text-[#111b24]')}>{option.label}</button>)}</div></fieldset>
}

function Generator({ compact = false, onGenerated }: { compact?: boolean; onGenerated?: (quest: Quest) => void }) {
  const router = useRouter()
  const [budget, setBudget] = useState('10')
  const [time, setTime] = useState('120')
  const [people, setPeople] = useState('3')
  const [transport, setTransport] = useState('best')
  const [vibes, setVibes] = useState<string[]>(['Social'])
  const [intent, setIntent] = useState('SURPRISE')
  const [location] = useState('London')
  const [area, setArea] = useState('')
  const [areaSearch, setAreaSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authRequired, setAuthRequired] = useState(false)
  const visibleAreas = LONDON_AREAS.filter((item) => item.name.toLowerCase().includes(areaSearch.toLowerCase()))

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sidequest-pending')
      if (!saved) return
      const pending = JSON.parse(saved) as { area?: string; budget?: string; time?: string; people?: string; transport?: string; vibes?: string[]; intent?: string }
      if (pending.area) setArea(pending.area)
      if (pending.budget) setBudget(pending.budget)
      if (pending.time) setTime(pending.time)
      if (pending.people) setPeople(pending.people)
      if (pending.transport) setTransport(pending.transport)
      if (pending.vibes?.length) setVibes(pending.vibes)
      if (pending.intent) setIntent(pending.intent)
    } catch { /* ignore malformed session state */ }
  }, [])

  const toggleVibe = (vibe: string) => setVibes((current) => current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe])
  const generate = async () => {
    if (!area || vibes.length === 0) { setError('Choose a London area and at least one vibe before generating your SideQuest.'); return }
    const { data } = await createClient().auth.getUser()
    if (!data.user) {
      sessionStorage.setItem('sidequest-pending', JSON.stringify({ location, area, budget, time, people, transport, vibes, intent }))
      setAuthRequired(true)
      return
    }
    setError(''); setAuthRequired(false); setLoading(true)
    try {
      const previous = sessionStorage.getItem('sidequest-current')
      let excludePlaceIds: string[] = []
      try {
        const parsed = previous ? JSON.parse(previous) as { steps?: Array<{ placeId?: string }> } : null
        excludePlaceIds = parsed?.steps?.map((step) => step.placeId).filter((id): id is string => Boolean(id)) ?? []
      } catch { /* ignore */ }
      sessionStorage.setItem('sidequest-pending', JSON.stringify({ location, area, budget, time, people, transport, vibes, intent }))
      const response = await fetch('/api/quests/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ location, area, budget, time, people, transport, vibes, intent, excludePlaceIds }) })
      const payload = await response.json() as { quest?: Quest; error?: string }
      if (!response.ok || !payload.quest) throw new Error(payload.error ?? 'We could not build your SideQuest.')
      sessionStorage.setItem('sidequest-current', JSON.stringify(payload.quest))
      onGenerated?.(payload.quest)
      if (!onGenerated) router.push('/quest')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not build your SideQuest.')
    } finally { setLoading(false) }
  }

  return <div className={cn('rounded-[28px] bg-white p-5 shadow-[0_25px_80px_rgba(15,28,36,0.16)] sm:p-7', compact ? 'max-w-2xl' : 'w-full')}>
    <div className="mb-6 flex items-start justify-between gap-3"><div><p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#829097]">Build your mission</p><h2 className="font-display text-2xl font-black tracking-[-0.04em] text-[#111b24] sm:text-3xl">What sounds good?</h2></div><span className="rounded-full bg-[#eef8d0] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#425500]">1 min setup</span></div>
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3"><label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]"><MapPin className="size-4" />City</label><div className="flex h-12 items-center justify-between rounded-xl border border-[#dce4e5] bg-[#f7f9f8] px-4"><span className="text-base font-black text-[#111b24]">London</span><span className="rounded-full bg-[#eef8d0] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#425500]">Available now</span></div><p className="text-xs text-[#829097]">SideQuest is London-only for now, so there is nothing to type here.</p></div>
      <fieldset className="flex flex-col gap-3"><legend className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]"><MapPin className="size-4" />Which part of London?</legend><div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-[#829097]" aria-hidden="true" /><input aria-label="Search London areas" value={areaSearch} onChange={(event) => setAreaSearch(event.target.value)} placeholder="Search an area, like Victoria" className="h-11 w-full rounded-xl border border-[#dce4e5] bg-[#f7f9f8] pl-9 pr-3 text-sm font-semibold text-[#111b24] outline-none transition placeholder:text-[#9aa6aa] focus:border-[#111b24] focus:ring-2 focus:ring-[#e9ff65]" /></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleAreas.map((item) => <button type="button" key={item.id} onClick={() => setArea(item.name)} aria-pressed={area === item.name} className={cn('rounded-xl border px-3 py-2.5 text-left transition-all', area === item.name ? 'border-[#111b24] bg-[#111b24] text-white' : 'border-[#dce4e5] bg-white text-[#53636a] hover:border-[#111b24]')}><span className="block text-sm font-extrabold">{item.name}</span><span className="text-[10px] opacity-60">{item.borough}</span></button>)}</div><p className="text-xs text-[#829097]">Choose the area you want to explore. Live places will be matched around it.</p></fieldset>
      <SelectionRow label="How much do you want to spend?" icon={<span className="text-base">£</span>} options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
      <SelectionRow label="How much time have you got?" icon={<Timer className="size-4" />} options={TIME_OPTIONS} value={time} onChange={setTime} />
      <SelectionRow label="Who's coming?" icon={<Users className="size-4" />} options={PEOPLE_OPTIONS} value={people} onChange={setPeople} />
      <fieldset className="flex flex-col gap-3"><legend className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]"><Navigation className="size-4" />How do you want to get around?</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ id: 'walk', label: 'Walking' }, { id: 'transit', label: 'Tube / bus' }, { id: 'bike', label: 'Bike' }, { id: 'best', label: 'Best option' }].map((option) => <button type="button" key={option.id} onClick={() => setTransport(option.id)} aria-pressed={transport === option.id} className={cn('min-h-11 rounded-xl border px-3 text-sm font-bold transition-all', transport === option.id ? 'border-[#111b24] bg-[#111b24] text-white shadow-[0_4px_0_#e9ff65]' : 'border-[#dce4e5] bg-white text-[#53636a] hover:border-[#111b24]')}>{option.label}</button>)}</div><p className="text-xs text-[#829097]">Route planning will use this preference once live routing is connected.</p></fieldset>
      <fieldset className="flex flex-col gap-3"><legend className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]"><Sparkles className="size-4" />What's the vibe?</legend><div className="flex flex-wrap gap-2">{VIBE_CATEGORIES.map((vibe) => <button type="button" key={vibe.id} onClick={() => toggleVibe(vibe.label)} aria-pressed={vibes.includes(vibe.label)} className={cn('rounded-full border px-3.5 py-2 text-sm font-bold transition-all', vibes.includes(vibe.label) ? 'border-[#111b24] bg-[#111b24] text-white' : 'border-[#dce4e5] bg-white text-[#53636a] hover:border-[#111b24] hover:text-[#111b24]')}>{vibe.icon} {vibe.label}</button>)}</div></fieldset>
      <fieldset className="flex flex-col gap-3"><legend className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#53636a]"><Target className="size-4" />What do you want to do?</legend><p className="text-xs leading-5 text-[#829097]">Vibe tells us how it should feel. This tells us what kind of place you actually want.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{INTENT_CATEGORIES.map((option) => <button type="button" key={option.id} onClick={() => setIntent(option.id)} aria-pressed={intent === option.id} className={cn('rounded-2xl border p-3 text-left transition-all', intent === option.id ? 'border-[#111b24] bg-[#111b24] text-white shadow-[0_4px_0_#e9ff65]' : 'border-[#dce4e5] bg-white text-[#53636a] hover:-translate-y-0.5 hover:border-[#111b24]')}><span className="block text-lg">{option.icon}</span><span className="mt-1 block text-sm font-black">{option.label}</span><span className={cn('mt-0.5 block text-[10px] leading-4', intent === option.id ? 'text-white/55' : 'text-[#829097]')}>{option.description}</span></button>)}</div></fieldset>
    </div>
    {error && <p className="mt-4 text-sm font-semibold text-[#bd452e]" role="alert">{error}</p>}
    {authRequired && <div className="mt-4 rounded-2xl border border-[#dce4e5] bg-[#f7f9f8] p-4" role="alert"><p className="text-sm font-black text-[#111b24]">Create an account to generate your SideQuest.</p><p className="mt-1 text-xs leading-5 text-[#6a777d]">Your choices are saved and will be ready when you come back.</p><Link href="/auth?next=/generate" className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111b24] px-4 text-xs font-extrabold text-white transition hover:bg-[#263943]">Continue to signup <ArrowRight className="size-4" /></Link></div>}
    <button type="button" onClick={generate} disabled={loading} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e9ff65] text-sm font-black tracking-wide text-[#111b24] transition-all hover:-translate-y-1 hover:bg-[#d8ef4e] hover:shadow-[0_7px_0_#111b24] disabled:cursor-wait disabled:opacity-70">{loading ? <><LoaderCircle className="size-5 animate-spin" /> Matching your vibe…</> : <>GENERATE MY SIDEQUEST <ArrowRight className="size-5" /></>}</button>
    <p className="mt-3 text-center text-xs text-[#829097]">Your quest is matched from 500 curated candidates around the selected London area, with live Geoapify fallback for missing categories.</p>
  </div>
}

function SectionHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: React.ReactNode }) { return <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#788a39]">{eyebrow}</p><h2 className="font-display max-w-xl text-3xl font-black tracking-[-0.05em] text-[#111b24] sm:text-4xl">{title}</h2>{body && <p className="mt-3 max-w-lg text-base leading-7 text-[#6a777d]">{body}</p>}</div>{action}</div> }

function HowItWorks() { const items = [{ num: '01', icon: <Compass />, title: 'Tell us your situation', body: 'Location, budget, time and vibe. No life admin required.' }, { num: '02', icon: <Sparkles />, title: 'We build your SideQuest', body: 'A loose plan with enough structure to get you moving.' }, { num: '03', icon: <Footprints />, title: 'Go do it', body: 'Complete it, rate it, and make the ordinary less ordinary.' }]; return <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><SectionHeading eyebrow="How it works" title="Less scrolling. More stories." body="SideQuest turns a spare afternoon into a plan you'll actually want to leave the house for."/><div className="grid gap-4 md:grid-cols-3">{items.map((item) => <article key={item.num} className="group rounded-3xl border border-[#dce4e5] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#111b24] hover:shadow-[0_15px_40px_rgba(15,28,36,0.08)]"><div className="mb-12 flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[#eef8d0] text-[#111b24] transition-transform group-hover:rotate-6">{item.icon}</span><span className="font-display text-5xl font-black tracking-[-0.08em] text-[#dfe8ea]">{item.num}</span></div><h3 className="font-display text-xl font-black tracking-[-0.03em] text-[#111b24]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#6a777d]">{item.body}</p></article>)}</div></section> }

function ActivityCard({ activity, onClick }: { activity: Activity; onClick?: () => void }) { return <button type="button" onClick={onClick} className="group min-w-[260px] overflow-hidden rounded-3xl border border-[#dce4e5] bg-white text-left transition-all hover:-translate-y-1 hover:border-[#111b24] hover:shadow-[0_15px_40px_rgba(15,28,36,0.1)] sm:min-w-0"><div className="relative h-44 overflow-hidden bg-[#c8d3ce]"><div className="absolute inset-0 bg-gradient-to-br from-[#b7c6bf] via-[#7e9b91] to-[#364c53] transition-transform duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(233,255,101,0.9),transparent_28%),linear-gradient(135deg,transparent_45%,rgba(17,27,36,0.5))]"/><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#111b24]">{activity.category}</span><span className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full bg-[#e9ff65] text-[#111b24]"><ArrowRight className="size-4" /></span></div><div className="p-5"><h3 className="font-display text-xl font-black tracking-[-0.04em] text-[#111b24]">{activity.title}</h3><p className="mt-1 text-sm text-[#6a777d]">{activity.description}</p><div className="mt-5 flex items-center gap-3 text-xs font-bold text-[#53636a]"><span>£{activity.estimatedCost}</span><span className="size-1 rounded-full bg-[#aebbbd]"/><span>{activity.estimatedTime >= 60 ? `${activity.estimatedTime / 60}h` : `${activity.estimatedTime}m`}</span><span className="size-1 rounded-full bg-[#aebbbd]"/><span>{activity.difficulty}/10</span></div></div></button> }

function Trending() { const [active, setActive] = useState('All'); const filters = ['All', ...Array.from(new Set(TRENDING_QUESTS.map((q) => q.category)))]; const quests = active === 'All' ? TRENDING_QUESTS : TRENDING_QUESTS.filter((q) => q.category === active); return <section className="bg-[#f2f6f4] px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="For when you need a nudge" title="Trending SideQuests" body="A few good places to start. Tap one to see the kind of mission we mean." action={<Link href="/explore" className="hidden items-center gap-2 text-sm font-extrabold text-[#111b24] sm:flex">See all <ArrowRight className="size-4" /></Link>}/><div className="mb-6 flex gap-2 overflow-x-auto pb-1">{filters.map((filter) => <button type="button" key={filter} onClick={() => setActive(filter)} className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold transition-colors', active === filter ? 'border-[#111b24] bg-[#111b24] text-white' : 'border-[#cbd8d7] text-[#53636a] hover:border-[#111b24]')}>{filter}</button>)}</div><div className="flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3 lg:grid-cols-5">{quests.map((activity) => <ActivityCard key={activity.id} activity={activity} onClick={() => { window.location.href = '/quest' }} />)}</div></div></section> }

function VibeSection() { const [selected, setSelected] = useState(''); return <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><SectionHeading eyebrow="Start with a feeling" title="Pick your vibe." body="No wrong answers. You can always change your mind halfway through."/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{VIBE_CATEGORIES.map((vibe) => <button type="button" key={vibe.id} onClick={() => setSelected(vibe.label)} className={cn('flex min-h-28 flex-col items-start justify-between rounded-3xl border p-4 text-left transition-all hover:-translate-y-1', selected === vibe.label ? 'border-[#111b24] bg-[#111b24] text-white shadow-[0_5px_0_#e9ff65]' : 'border-[#dce4e5] bg-white text-[#111b24] hover:border-[#111b24]')}><span className="text-2xl">{vibe.icon}</span><span className="text-sm font-extrabold">{vibe.label}</span></button>)}</div>{selected && <p className="mt-5 text-sm font-bold text-[#6a777d]">{selected} selected. <Link href="/generate" className="text-[#111b24] underline underline-offset-4">Build this SideQuest <ArrowRight className="inline size-3" /></Link></p>}</section> }

function Cities() { const [city, setCity] = useState('London'); return <section className="border-y border-[#dce4e5] bg-white px-5 py-16 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#788a39]">Where to next?</p><h2 className="font-display text-3xl font-black tracking-[-0.05em] text-[#111b24]">SideQuests, city by city.</h2></div><div className="flex flex-wrap gap-2">{CITIES.map((item) => <button type="button" key={item.id} onClick={() => item.active && setCity(item.name)} className={cn('rounded-full border px-4 py-2.5 text-sm font-bold transition-colors', city === item.name ? 'border-[#111b24] bg-[#111b24] text-white' : 'border-[#dce4e5] text-[#53636a] hover:border-[#111b24]', !item.active && 'cursor-not-allowed opacity-50')}><span>{item.name}</span>{!item.active && <span className="ml-1.5 text-[9px] uppercase tracking-wider">soon</span>}</button>)}</div></div><p className="mt-5 text-sm text-[#829097]">Showing missions around <strong className="text-[#111b24]">{city}</strong>. More cities are on their way.</p></div></section> }

function Home() { return <><Navbar/><main className="bg-[#f7f9f8]"><section className="relative overflow-hidden bg-[#111b24] px-5 pb-20 pt-32 lg:px-8 lg:pb-28 lg:pt-40"><div className="pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-[#e9ff65]/10 blur-3xl"/><div className="pointer-events-none absolute -left-40 bottom-0 size-96 rounded-full bg-[#6c9c87]/20 blur-3xl"/><div className="relative mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20"><div className="pt-5"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/75"><span className="size-2 rounded-full bg-[#e9ff65]"/> Your next story starts here</div><h1 className="font-display max-w-xl text-5xl font-black leading-[0.94] tracking-[-0.07em] text-white sm:text-7xl">BORED?<br/><span className="text-[#e9ff65]">GO ON A</span><br/>SIDEQUEST.</h1><p className="mt-7 max-w-md text-base leading-7 text-white/65 sm:text-lg">Tell us where you are, how much time you have, your budget and your vibe. We'll find something worth doing.</p><div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-white/50"><span className="flex items-center gap-2"><Sparkles className="size-4 text-[#e9ff65]"/> Made for real life</span><span className="flex items-center gap-2"><Navigation className="size-4 text-[#e9ff65]"/> Start anywhere</span></div></div><Generator/></div></section><HowItWorks/><Trending/><VibeSection/><section className="bg-[#111b24] px-5 py-20 text-white lg:px-8 lg:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center"><div><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#e9ff65]">Make it a memory</p><h2 className="font-display max-w-lg text-4xl font-black leading-tight tracking-[-0.06em] sm:text-5xl">Your weekend doesn't have to be another night on the sofa.</h2><p className="mt-5 max-w-md leading-7 text-white/60">SideQuests are designed to be shared, screenshotted and remembered. This is your sign to make a plan with no plan.</p></div><div className="grid gap-4 sm:grid-cols-2"><CompletedMini/><CompletedMini second/></div></div></section><Cities/></main><Footer/></> }

function CompletedMini({ second = false }: { second?: boolean }) { return <div className={cn('rounded-3xl p-5 text-[#111b24]', second ? 'rotate-2 bg-[#e9ff65]' : '-rotate-2 bg-white')}><div className="flex items-start justify-between"><Zap className="size-5"/><span className="text-[10px] font-black uppercase tracking-wider">{second ? 'Quest #184' : 'Complete'}</span></div><p className="mt-8 text-xs font-black uppercase tracking-wider opacity-50">SideQuest complete</p><h3 className="mt-1 font-display text-2xl font-black tracking-[-0.05em]">London at golden hour</h3><div className="mt-5 flex gap-4 text-xs font-bold"><span>£8.60</span><span>1h 54m</span><span>8.2/10</span></div></div> }

function MapPlaceholder({ quest }: { quest: Quest }) { return <div className="relative h-[330px] overflow-hidden rounded-3xl border border-[#cbd8d7] bg-[#dfe9e4]" aria-label="Map setup placeholder"><div className="absolute right-4 top-4 z-10 rounded-full border border-[#111b24]/10 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#111b24]">Live route map</div><div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(28deg, transparent 48%, #b5ccc0 49%, #b5ccc0 50%, transparent 51%), linear-gradient(112deg, transparent 48%, #b5ccc0 49%, #b5ccc0 50%, transparent 51%), linear-gradient(#c9ddd3 1px, transparent 1px), linear-gradient(90deg, #c9ddd3 1px, transparent 1px)', backgroundSize: '100% 100%, 100% 100%, 52px 52px, 52px 52px' }}/><div className="absolute left-1/4 top-1/3 h-1 w-1/2 rotate-[22deg] rounded-full bg-[#111b24] shadow-[0_0_0_5px_rgba(17,27,36,0.08)]"/><div className="absolute left-1/4 top-1/3 h-1 w-1/2 -rotate-[18deg] rounded-full bg-[#111b24] shadow-[0_0_0_5px_rgba(17,27,36,0.08)]"/><div className="absolute left-[23%] top-[25%] grid size-10 place-items-center rounded-full bg-[#111b24] text-[#e9ff65] shadow-lg"><Navigation className="size-5 fill-current"/></div><div className="absolute left-[49%] top-[51%] grid size-9 place-items-center rounded-full border-4 border-white bg-[#e9ff65] text-[#111b24] shadow-lg"><span className="size-2 rounded-full bg-[#111b24]"/></div><div className="absolute right-[18%] top-[30%] grid size-9 place-items-center rounded-full border-4 border-white bg-[#bd5a46] text-white shadow-lg"><Star className="size-4 fill-current"/></div><div className="absolute right-[22%] bottom-[19%] grid size-9 place-items-center rounded-full border-4 border-white bg-[#6c9c87] text-white shadow-lg"><Target className="size-4"/></div><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#111b24]">Map · mock data</span><span className="absolute bottom-4 left-[19%] text-[10px] font-extrabold uppercase tracking-wider text-[#53636a]">Start here</span><span className="absolute right-[13%] bottom-[12%] text-[10px] font-extrabold uppercase tracking-wider text-[#53636a]">Final stop</span></div> }

function LoadingState() { return <div className="flex min-h-[65vh] items-center justify-center bg-[#111b24] px-5 pt-20"><div className="text-center text-white"><div className="mx-auto mb-8 grid size-20 place-items-center rounded-3xl bg-[#e9ff65] text-[#111b24] shadow-[0_0_0_12px_rgba(233,255,101,0.1)]"><LoaderCircle className="size-9 animate-spin"/></div><p className="font-display text-3xl font-black tracking-[-0.05em]">Building your SideQuest<span className="animate-pulse">...</span></p><div className="mt-6 flex flex-col gap-2 text-sm text-white/55"><span>Checking nearby spots</span><span>Matching your vibe</span><span>Adding a little surprise</span></div></div></div> }

function QuestPage() {
  const [quest, setQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const router = useRouter()

  async function toggleSaved() {
    if (!quest || saveBusy) return
    setSaveBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth?next=/quest'); setSaveBusy(false); return }
    const result = saved
      ? await supabase.from('saved_quests').delete().eq('user_id', user.id).eq('quest_id', quest.id)
      : await supabase.from('saved_quests').upsert({ user_id: user.id, quest_id: quest.id })
    if (!result.error) setSaved(!saved)
    setSaveBusy(false)
  }

  useEffect(() => {
    const stored = sessionStorage.getItem('sidequest-current')
    const parsed = stored ? JSON.parse(stored) as Quest : null
    if (parsed) {
      setQuest(parsed)
      void (async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('saved_quests').select('quest_id').eq('user_id', user.id).eq('quest_id', parsed.id).maybeSingle()
        setSaved(Boolean(data))
      })()
    }
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  if (loading) return <><Navbar /><LoadingState /></>
  if (!quest) return <><Navbar /><ErrorState /></>
  return (
    <>
      <Navbar />
      <main className="bg-[#f7f9f8] px-5 pb-20 pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Link href="/generate" className="mb-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#788a39]"><ChevronRight className="size-4 rotate-180" /> Edit your brief</Link>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#788a39]">Your live SideQuest</p>
              <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.06em] text-[#111b24] sm:text-6xl">{quest.location} · £{quest.budget} · {quest.timeMinutes >= 60 ? `${quest.timeMinutes / 60} HOURS` : `${quest.timeMinutes} MIN`}</h1>
            </div>
            <button type="button" onClick={toggleSaved} className={cn('grid size-11 place-items-center rounded-full border', saved ? 'border-[#111b24] bg-[#111b24] text-[#e9ff65]' : 'border-[#dce4e5] text-[#53636a]')} disabled={saveBusy} aria-label={saved ? 'Unsave quest' : 'Save quest'}>{saved ? <Check /> : <Bookmark />}</button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-[30px] bg-[#111b24] p-6 text-white sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e9ff65]">Your mission</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.06em]">{quest.title}</h2>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-white/60"><span>Difficulty {quest.difficulty}/10</span><span>·</span><span>{quest.costLabel || (quest.totalCost > 0 ? `Known cost £${quest.totalCost}` : 'Cost varies')}</span><span>·</span><span>{quest.timeMinutes} min</span>{quest.intent && <><span>·</span><span className="rounded-full bg-[#e9ff65]/10 px-2.5 py-1 text-[#e9ff65]">{quest.intent === 'EAT' ? 'Want to eat' : quest.intent === 'GAMES' ? 'Games & arcades' : quest.intent === 'DRINKS' ? 'Drinks / bars' : quest.intent === 'SHOPPING' ? 'Shopping' : quest.intent.charAt(0) + quest.intent.slice(1).toLowerCase()}</span></>}</div>
              <div className="mt-8 flex flex-col gap-3">{quest.steps.map((step) => { const realStep = step as typeof step & { name?: string; placeId?: string; address?: string | null; postcode?: string | null; activity?: string; activityGroup?: string; intents?: string[]; genres?: string[]; priceLabel?: string }; return <article key={step.number} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#e9ff65]/30 hover:bg-white/[0.07]"><div className="flex items-start gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9ff65] text-xs font-black text-[#111b24]">{String(step.number).padStart(2, '0')}</span><div className="min-w-0 flex-1"><h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e9ff65]">GO TO</h3><h4 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">{realStep.name || 'Venue unavailable'}</h4><div className="mt-2 text-sm leading-6 text-white/60"><p>{realStep.address || `${quest.location}, London`}</p>{realStep.postcode && !(realStep.address ?? '').includes(realStep.postcode) && <p className="font-bold text-white/75">{realStep.postcode}</p>}</div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e9ff65]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#e9ff65]">{realStep.activity || 'Activity'}</span>{(realStep.genres ?? []).slice(0, 5).map((genre) => <span key={genre} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">{genre}</span>)}</div><div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-white/40">Price</p><p className="mt-1 text-sm font-black text-[#e9ff65]">{realStep.priceLabel || 'PRICE NOT AVAILABLE'}</p></div><div><p className="text-[10px] font-black uppercase tracking-wider text-white/40">Time here</p><p className="mt-1 text-sm font-black text-white">{step.duration ? `${step.duration} MIN` : 'FINISH'}</p></div></div></div></div></article>})}</div>
              <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => router.push('/complete')} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#e9ff65] px-5 text-sm font-black text-[#111b24]">Start Quest <Play className="size-4 fill-current" /></button><button type="button" onClick={() => router.push('/generate')} className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-black text-white">Generate another <RotateCcw className="size-4" /></button></div>
            </section>
            <div className="flex flex-col gap-6"><LiveMap points={[...((quest as Quest & { start?: object }).start ? [((quest as Quest & { start?: object }).start as object)] : []), ...quest.steps.map((step) => (step as Quest['steps'][number] & { place?: object }).place ?? {})] as Array<{ name?: string; latitude?: number; longitude?: number; formattedAddress?: string; category?: string; activity?: string; postcode?: string | null }>} /><div className="rounded-3xl border border-[#dce4e5] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#788a39]">Good to know</p><p className="mt-3 text-sm leading-6 text-[#6a777d]">Places are selected from SideQuest's curated London catalogue. Geoapify is used as a live fallback for missing categories and for map/location services. Prices marked EST. are category estimates, so check the venue before setting off.</p></div></div>
          </div>
        </div>
      </main><Footer />
    </>
  )
}

function CompletePage() { const quest = COMPLETED_QUEST_EXAMPLE; return <><Navbar/><main className="min-h-[calc(100vh-72px)] bg-[#111b24] px-5 pb-20 pt-32 lg:px-8"><div className="mx-auto max-w-5xl"><div className="mb-10 text-center text-white"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#e9ff65] text-[#111b24]"><Check className="size-7"/></div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e9ff65]">Mission accomplished</p><h1 className="mt-3 font-display text-5xl font-black tracking-[-0.07em] sm:text-7xl">SIDEQUEST COMPLETE.</h1><p className="mt-4 text-white/60">You made London a little less predictable.</p></div><div className="mx-auto max-w-md rotate-[-1deg] rounded-[30px] bg-[#e9ff65] p-6 text-[#111b24] shadow-[15px_20px_0_rgba(0,0,0,0.2)] sm:p-8"><div className="flex items-start justify-between"><div className="flex items-center gap-2 text-sm font-black"><span className="grid size-8 place-items-center rounded-lg bg-[#111b24] text-[#e9ff65]"><Zap className="size-4 fill-current"/></span> SIDEQUEST</div><span className="text-xs font-black uppercase tracking-wider">Quest #{quest.questNumber}</span></div><div className="mt-20"><p className="text-xs font-black uppercase tracking-[0.18em] opacity-60">SideQuest complete</p><h2 className="mt-2 font-display text-4xl font-black leading-none tracking-[-0.06em]">{quest.city}<br/>at golden hour.</h2></div><div className="mt-10 grid grid-cols-3 border-t border-[#111b24]/20 pt-4"><div><p className="text-[10px] font-black uppercase opacity-50">Spent</p><p className="mt-1 text-lg font-black">£{quest.spent.toFixed(2)}</p></div><div><p className="text-[10px] font-black uppercase opacity-50">Time</p><p className="mt-1 text-lg font-black">1h 54m</p></div><div><p className="text-[10px] font-black uppercase opacity-50">Difficulty</p><p className="mt-1 text-lg font-black">{quest.difficulty}/10</p></div></div><div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-wider opacity-60"><span>Example result</span><span>06 · 10 · 26</span></div></div><div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"><button type="button" onClick={() => navigator.clipboard?.writeText('My SideQuest is complete!')} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-[#111b24] hover:bg-[#e9ff65]"><Share2 className="size-4"/> Share result</button><Link href="/generate" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 text-sm font-black text-white hover:border-[#e9ff65] hover:text-[#e9ff65]">Do another <ArrowRight className="size-4"/></Link></div></div></main></> }

function ExplorePage() { return <><Navbar/><main className="bg-[#f7f9f8] px-5 pb-20 pt-32 lg:px-8"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Find your next move" title="Explore SideQuests" body="Borrow a plan, remix it, or use it as permission to get out the door." action={<Link href="/generate" className="flex items-center gap-2 rounded-full bg-[#111b24] px-5 py-3 text-sm font-black text-white">Make mine <ArrowRight className="size-4"/></Link>}/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{TRENDING_QUESTS.map((activity) => <ActivityCard key={activity.id} activity={activity} onClick={() => { window.location.href = '/quest' }}/>)}</div></div></main><Footer/></> }

function EmptyPage({ type }: { type: 'saved' | 'profile' }) { const saved = type === 'saved'; return <><Navbar/><main className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#f7f9f8] px-5 pb-20 pt-28"><div className="w-full max-w-md text-center"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#eef8d0] text-[#111b24]">{saved ? <Bookmark className="size-7"/> : <CircleUserRound className="size-7"/>}</div><h1 className="mt-7 font-display text-4xl font-black tracking-[-0.06em] text-[#111b24]">{saved ? "You haven't saved anything yet." : 'Your SideQuest history will appear here.'}</h1><p className="mt-4 text-base leading-7 text-[#6a777d]">{saved ? 'The good ones deserve a second look. Generate a quest and save it here.' : 'Complete a mission and your adventures will start to collect here.'}</p><Link href={saved ? '/generate' : '/explore'} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#111b24] px-5 text-sm font-black text-white hover:bg-[#2c3d47]">{saved ? 'Find a SideQuest' : 'Explore quests'} <ArrowRight className="size-4"/></Link></div></main><Footer/></> }

function HowPage() { return <><Navbar/><main className="bg-[#f7f9f8] px-5 pb-20 pt-32 lg:px-8"><div className="mx-auto max-w-4xl"><div className="rounded-[32px] bg-[#111b24] px-6 py-14 text-white sm:px-12 sm:py-20"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e9ff65]">The idea</p><h1 className="mt-4 max-w-2xl font-display text-5xl font-black leading-[0.95] tracking-[-0.07em] sm:text-7xl">Turn "what should we do?" into "remember when we…"</h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/65">SideQuest is a simple way to find a genuinely fun thing to do when your group chat has run out of ideas.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-3">{['Set the scene', 'Get a mission', 'Make it yours'].map((title, index) => <div key={title} className="rounded-3xl border border-[#dce4e5] bg-white p-6"><span className="font-display text-4xl font-black text-[#788a39]">0{index + 1}</span><h2 className="mt-10 font-display text-xl font-black text-[#111b24]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6a777d]">{index === 0 ? 'Give us the useful stuff: where you are, your budget, time and vibe.' : index === 1 ? 'We combine it into an example mission with a beginning, middle and a reason to leave the sofa.' : 'Take the scenic route, skip a step or add your own twist. The plan is a starting point.'}</p></div>)}</div><div className="mt-8 rounded-3xl border border-[#dce4e5] bg-white p-6 sm:p-8"><p className="text-sm leading-7 text-[#6a777d]"><strong className="text-[#111b24]">Live London catalogue:</strong> SideQuest matches real named places from the curated catalogue, then uses your area, budget, time, vibe and activity intent to build the plan. Prices marked EST. are estimates, so check the venue before setting off.</p></div></div></main><Footer/></> }

export default function SideQuestApp({ page }: { page?: string }) { if (page === 'quest') return <QuestPage/>; if (page === 'complete') return <CompletePage/>; if (page === 'explore') return <ExplorePage/>; if (page === 'saved') return <EmptyPage type="saved"/>; if (page === 'profile') return <EmptyPage type="profile"/>; if (page === 'how-it-works') return <HowPage/>; if (page === 'generate') return <><Navbar/><main className="min-h-screen bg-[#111b24] px-5 pb-20 pt-32 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10 max-w-xl text-white"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e9ff65]">Your next move</p><h1 className="mt-4 font-display text-5xl font-black leading-none tracking-[-0.07em] sm:text-7xl">Give us the<br/><span className="text-[#e9ff65]">ingredients.</span></h1><p className="mt-5 text-base leading-7 text-white/60">We'll give you a reason to head out.</p></div><Generator/></div></main></>; return <Home/> }

export { MapPlaceholder }

// Future integration boundary: replace MapPlaceholder with a Mapbox or Google Maps component when live location data is available.

export function ErrorState() { return <div className="grid min-h-screen place-items-center bg-[#f7f9f8] px-5 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#fee7df] text-[#bd452e]"><X className="size-7"/></div><h1 className="mt-6 font-display text-4xl font-black tracking-[-0.06em] text-[#111b24]">That SideQuest got lost.</h1><p className="mt-3 text-[#6a777d]">Let's try finding another route.</p><Link href="/generate" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#111b24] px-5 text-sm font-black text-white">Try again <RotateCcw className="size-4"/></Link></div></div> }
