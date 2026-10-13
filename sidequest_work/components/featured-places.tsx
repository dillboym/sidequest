'use client'

import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { FeaturedPlace } from '@/lib/sidequest/featured'

export function FeaturedPlaces({ places }: { places: FeaturedPlace[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{places.map((place,index) => <Link key={place.id} href={`/generate?area=${encodeURIComponent(place.area)}&intent=${place.intent}`} className="destination-card group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#dce4e5] bg-white text-[#111b24]">
    <div className="mission-grid flex min-h-40 flex-col justify-between bg-[#111b24] p-5 text-white">
      <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.2em] text-[#e9ff65]">London field notes / 0{index+1}</span><ArrowUpRight className="size-5 text-[#e9ff65]" /></div>
      <p className="mt-8 font-display text-3xl font-black uppercase tracking-[-.05em]">{place.area}</p>
    </div>
    <div className="flex flex-1 flex-col gap-3 p-5"><span className="w-fit rounded-full bg-[#eef8d0] px-3 py-1 text-[10px] font-black uppercase tracking-wider">{place.activity}</span><h3 className="text-xl font-black tracking-tight">{place.name}</h3><p className="flex items-start gap-2 text-xs leading-5 text-[#53636a]"><MapPin className="mt-0.5 size-4 shrink-0" />{place.address}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#dce4e5] pt-4 text-xs font-black"><span>{place.price}</span><span>{place.duration} MIN</span></div><p className="text-[11px] text-[#6a777d]">Build a {place.area} brief — final stops depend on your filters.</p></div>
  </Link>)}</div>
}
