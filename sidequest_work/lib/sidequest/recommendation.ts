import type { NormalizedCataloguePlace } from './catalogue'

export const INTENTS = ['SURPRISE','EAT','DRINKS','GAMES','SHOPPING','ACTIVE','CULTURE','CINEMA','NIGHTLIFE','OUTDOORS'] as const
export type SideQuestIntent = (typeof INTENTS)[number]

const PARK_ACTIVITIES = new Set(['Park', 'Garden', 'Scenic'])

export function placeIntents(place: Pick<NormalizedCataloguePlace, 'activity' | 'activityGroup' | 'genres'>): SideQuestIntent[] {
  const text = `${place.activity} ${place.activityGroup} ${place.genres.join(' ')}`.toLowerCase()
  const result = new Set<SideQuestIntent>()
  if (/restaurant|cafe|coffee|food|dessert|bakery|pizza|market/.test(text)) result.add('EAT')
  if (/pub|bar|taproom|nightlife/.test(text)) { result.add('DRINKS'); result.add('NIGHTLIFE') }
  if (/arcade|bowling|mini golf|escape|vr|gaming|darts|snooker|karaoke|game/.test(text)) result.add('GAMES')
  if (/shopping|mall|department|bookshop|record shop|retail|marketplace/.test(text)) result.add('SHOPPING')
  if (/active|sport|gym|climb|boulder|padel|tennis|swim|skate|trampoline/.test(text)) result.add('ACTIVE')
  if (/museum|gallery|theatre|historic|culture|arts centre|exhibition/.test(text)) result.add('CULTURE')
  if (/cinema|movie|theatre/.test(text)) result.add('CINEMA')
  if (/park|garden|scenic|outdoor|viewpoint|river/.test(text)) result.add('OUTDOORS')
  return [...result]
}

export function isParkLike(place: Pick<NormalizedCataloguePlace, 'activity' | 'activityGroup'>) {
  return PARK_ACTIVITIES.has(place.activity) || place.activityGroup === 'Outdoor'
}

export function estimateBudgetFit(place: NormalizedCataloguePlace, budget: number) {
  if (place.priceBand === 'UNKNOWN') return 0
  if (place.priceBand === 'SPEND_OPTIONAL') return budget >= 5 ? 10 : 4
  const min = place.estimatedPriceMin ?? (place.priceBand === 'FREE' ? 0 : null)
  const max = place.estimatedPriceMax ?? min
  if (min == null) return 0
  if (min > budget) return -120
  if (budget === 0) return min === 0 ? 25 : -120
  const midpoint = ((min ?? 0) + (max ?? min ?? 0)) / 2
  const ratio = midpoint / budget
  if (ratio >= 0.35 && ratio <= 0.85) return 30
  if (ratio > 0.85 && ratio <= 1.05) return 18
  if (ratio > 0.1) return 12
  return 2 // free/near-free is allowed, but not automatically best for a paid brief
}

export function scoreCandidate(place: NormalizedCataloguePlace, options: {
  intent: SideQuestIntent
  vibes: string[]
  budget: number
  excludePlaceIds?: string[]
}) {
  const intents = placeIntents(place)
  if (options.intent !== 'SURPRISE' && !intents.includes(options.intent)) return -10_000
  if (options.excludePlaceIds?.includes(place.id)) return -5_000

  const requestedVibes = options.vibes.map((v) => v.toLowerCase())
  const vibeMatches = place.genres.filter((g) => requestedVibes.includes(g.toLowerCase())).length
  let score = 0
  if (options.intent !== 'SURPRISE') score += 110
  score += vibeMatches * 36
  score += estimateBudgetFit(place, options.budget)
  if (place.formattedAddress && place.postcode) score += 24
  else if (place.formattedAddress) score += 10
  if (place.quality.includes('DESTINATION') || place.quality === 'PRIMARY_DESTINATION') score += 20

  const vibesText = requestedVibes.join(' ')
  if (isParkLike(place) && /chaotic|competitive|social|active/.test(vibesText)) score -= 180
  if (isParkLike(place) && ['EAT','DRINKS','GAMES','SHOPPING','ACTIVE','CULTURE','CINEMA','NIGHTLIFE'].includes(options.intent)) score -= 1000
  if (options.intent === 'SURPRISE' && isParkLike(place) && !/chill|romantic|scenic|outdoor/.test(vibesText)) score -= 80

  // Keep results fresh instead of returning the same first sorted rows forever.
  score += Math.random() * 16
  return score
}

export function visitDurationFor(place: NormalizedCataloguePlace, requestedMinutes: number) {
  const activity = place.activity.toLowerCase()
  let preferred = place.typicalDurationMinutes
  if (/cafe|dessert|bakery|bookshop|record|market|shopping/.test(activity)) preferred = Math.min(preferred, 40)
  if (/pub|bar|arcade/.test(activity)) preferred = Math.min(preferred, 60)
  if (/restaurant/.test(activity)) preferred = Math.min(preferred, 75)
  if (/park|garden|scenic/.test(activity)) preferred = Math.min(preferred, 45)
  const minimum = /cinema|theatre/.test(activity) ? 90 : /restaurant|bowling|escape|climb|active/.test(activity) ? 45 : 20
  if (requestedMinutes < minimum) return 0
  return Math.max(minimum, Math.min(preferred, requestedMinutes))
}
