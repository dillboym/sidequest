import { getAreaPlaces } from './catalogue'

export type FeaturedPlace = { id: string; name: string; area: string; address: string; activity: string; price: string; duration: number; intent: string }

export function getFeaturedPlaces(): FeaturedPlace[] {
  const selected = new Set<string>()
  return ['Camden','Soho','Victoria','Greenwich','Shoreditch','Brixton'].flatMap((area, index) => {
    const pool = getAreaPlaces(area).filter(p => p.usable && p.address.formatted && p.address.postcode && !selected.has(p.id) && ['Restaurant','Cafe','Cinema'].includes(p.activity))
    const place = pool.find(p => p.activity === ['Cafe','Restaurant','Cinema'][index % 3]) ?? pool[0]
    if (!place) return []
    selected.add(place.id)
    return [{ id: place.id, name: place.name, area, address: place.address.formatted!, activity: place.activity, price: place.price.min == null ? 'PRICE UNKNOWN' : `EST. £${place.price.min}–£${place.price.max ?? place.price.min} PP`, duration: place.typicalDurationMinutes, intent: place.activity === 'Cinema' ? 'CINEMA' : 'EAT' }]
  })
}
