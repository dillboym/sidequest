'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, LoaderCircle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/supabase/safe'

type QuestRow = { id: string; title: string; area: string; budget: number; time_minutes: number; vibes: string[]; created_at: string }

export default function SavedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quests, setQuests] = useState<QuestRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const s = createClient()
        const session = await withTimeout(s.auth.getSession(), 3000, 'Login check timed out')
        const user = session.data.session?.user
        if (!user) {
          router.replace('/auth?next=/saved')
          return
        }

        const savedResult = await withTimeout(
          s.from('saved_quests').select('quest_id').eq('user_id', user.id),
          5000,
          'Saved quests took too long to load',
        )
        const ids = (savedResult.data ?? []).map((x: { quest_id: string }) => x.quest_id)

        if (ids.length) {
          const questResult = await withTimeout(
            s.from('quests').select('id,title,area,budget,time_minutes,vibes,created_at').in('id', ids).order('created_at', { ascending: false }),
            5000,
            'Quest history took too long to load',
          )
          setQuests(questResult.data ?? [])
        }
      } catch {
        setError('Saved SideQuests could not load right now. You can still use the rest of SideQuest.')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#111b24]"><LoaderCircle className="size-8 animate-spin text-[#e9ff65]"/></main>
  }

  return <main className="min-h-screen bg-[#f7f9f8] px-5 pb-20 pt-10 lg:px-8"><div className="mx-auto max-w-5xl"><Link href="/profile" className="inline-flex items-center gap-2 text-sm font-black text-[#53636a]"><ArrowLeft className="size-4"/>Account</Link><div className="mt-8 rounded-[30px] bg-[#111b24] p-7 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e9ff65] text-[#111b24]"><Zap className="size-5 fill-current"/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#e9ff65]">Saved</p><h1 className="font-display text-4xl font-black tracking-[-.05em]">SideQuests worth keeping.</h1></div></div></div>{error && <div className="mt-6 rounded-2xl border border-[#f0c8bc] bg-[#fff1ec] p-4 text-sm font-bold text-[#9b3e2c]">{error}</div>}{quests.length?<div className="mt-6 grid gap-4 sm:grid-cols-2">{quests.map(q=><article key={q.id} className="rounded-3xl border border-[#dce4e5] bg-white p-5"><Bookmark className="size-5 text-[#788a39]"/><h2 className="mt-5 font-display text-2xl font-black tracking-[-.04em]">{q.title}</h2><p className="mt-2 text-sm text-[#6a777d]">{q.area} · £{q.budget} PP · {q.time_minutes} min</p><div className="mt-3 flex flex-wrap gap-1.5">{(q.vibes??[]).map(v=><span key={v} className="rounded-full bg-[#eef8d0] px-2 py-1 text-[10px] font-bold text-[#425500]">{v}</span>)}</div></article>)}</div>:<div className="mt-6 rounded-3xl border border-[#dce4e5] bg-white p-10 text-center"><Bookmark className="mx-auto size-7 text-[#788a39]"/><h2 className="mt-4 font-display text-2xl font-black">Nothing saved yet.</h2><p className="mt-2 text-sm text-[#6a777d]">Bookmark a generated quest and it will appear here.</p><Link href="/generate" className="mt-5 inline-flex rounded-xl bg-[#111b24] px-5 py-3 text-sm font-black text-white">Generate a SideQuest</Link></div>}</div></main>
}
