export type PlaceQuality = 'PRIMARY_DESTINATION' | 'SECONDARY_DESTINATION' | 'SCENIC_STOP' | 'TRANSIT_POINT' | 'MINOR_POI' | 'FOOD_DESTINATION' | 'NIGHTLIFE_DESTINATION'
export type PriceStatus = 'free' | 'known' | 'estimated' | 'unknown'

const MINOR_TERMS = ['plaque', 'relief', 'bench', 'post box', 'bike rack', 'toilet', 'atm', 'parking', 'bus stop', 'information board', 'utility', 'memorial']
const RULES = [
  { terms: ['bowling', 'arcade', 'mini golf', 'darts', 'pool', 'snooker', 'escape room', 'vr', 'karaoke', 'padel', 'tennis', 'climbing', 'gaming', 'trampoline'], activity: 'Competitive', tags: ['Competitive', 'Social', 'Group', 'Indoor'], quality: 'PRIMARY_DESTINATION' as PlaceQuality },
  { terms: ['restaurant', 'cafe', 'coffee', 'dessert', 'food hall', 'market', 'bakery', 'pizza', 'bar', 'pub'], activity: 'Food', tags: ['Foodie', 'Social', 'Date'], quality: 'FOOD_DESTINATION' as PlaceQuality },
  { terms: ['museum', 'gallery', 'theatre', 'historic', 'exhibition', 'cinema'], activity: 'Culture', tags: ['Creative', 'Chill', 'Indoor'], quality: 'PRIMARY_DESTINATION' as PlaceQuality },
  { terms: ['park', 'garden', 'viewpoint', 'scenic', 'walking', 'river'], activity: 'Outdoor', tags: ['Chill', 'Scenic', 'Outdoor', 'Budget'], quality: 'SCENIC_STOP' as PlaceQuality },
  { terms: ['club', 'nightclub', 'live music', 'music venue'], activity: 'Nightlife', tags: ['Social', 'Music', 'Nightlife', 'Group'], quality: 'NIGHTLIFE_DESTINATION' as PlaceQuality },
]

export function classifyPlace(input: { name?: string | null; category?: string | null; tags?: string[]; priceMin?: number | null; priceMax?: number | null; indoor?: boolean | null; outdoor?: boolean | null }) {
  const text = [input.name, input.category, ...(input.tags ?? [])].filter(Boolean).join(' ').toLowerCase()
  if (!input.name?.trim() || MINOR_TERMS.some((term) => text.includes(term))) return { primaryActivity: 'Minor POI', tags: ['Exploration'], quality: 'MINOR_POI' as PlaceQuality, priceStatus: 'unknown' as PriceStatus, indoor: input.indoor ?? null, outdoor: input.outdoor ?? null }
  const rule = RULES.find((candidate) => candidate.terms.some((term) => text.includes(term)))
  const priceStatus: PriceStatus = input.priceMin === 0 && input.priceMax === 0 ? 'free' : input.priceMin != null || input.priceMax != null ? 'known' : 'unknown'
  return { primaryActivity: rule?.activity ?? 'Explore', tags: rule?.tags ?? ['Explore'], quality: rule?.quality ?? 'SECONDARY_DESTINATION', priceStatus, indoor: input.indoor ?? null, outdoor: input.outdoor ?? null }
}

export function isUsablePrimary(quality: PlaceQuality) { return quality !== 'MINOR_POI' && quality !== 'TRANSIT_POINT' }
export function formatPrice(status: PriceStatus, min?: number | null, max?: number | null) {
  if (status === 'free') return 'FREE'
  if (status === 'known' && min != null && max != null) return `£${min}–£${max}`
  if (status === 'known' && min != null) return `from £${min}`
  if (status === 'estimated' && min != null && max != null) return `EST. £${min}–£${max}`
  return 'PRICE NOT AVAILABLE'
} 

export const CATEGORY_SEARCHES = ['food', 'entertainment', 'activity', 'sport', 'culture', 'tourism', 'parks', 'shopping', 'nightlife']

export function scorePlace(place: { quality: PlaceQuality; primaryActivity: string; tags: string[]; priceStatus: PriceStatus; priceMin?: number | null; priceMax?: number | null }, preferences: { vibes: string[]; budget: number; activity?: string }) {
  if (!isUsablePrimary(place.quality)) return -100
  let score = place.quality === 'PRIMARY_DESTINATION' || place.quality === 'FOOD_DESTINATION' || place.quality === 'NIGHTLIFE_DESTINATION' ? 20 : 0
  if (preferences.activity && place.primaryActivity.toLowerCase() === preferences.activity.toLowerCase()) score += 40
  score += preferences.vibes.reduce((total, vibe) => total + (place.tags.some((tag) => tag.toLowerCase() === vibe.toLowerCase()) ? 30 : 0), 0)
  if (place.priceStatus === 'known' && place.priceMin != null && place.priceMin <= preferences.budget) score += 15
  if (place.priceStatus === 'free' && preferences.budget === 0) score += 15
  return score
}
