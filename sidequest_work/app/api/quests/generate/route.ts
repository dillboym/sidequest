import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/supabase/safe'
import { geoapifyPlacesProvider } from '@/lib/places/geoapify'
import { getArea, getAreaPlaces, normalizeCataloguePlace, type NormalizedCataloguePlace } from '@/lib/sidequest/catalogue'
import { formatPrice } from '@/lib/sidequest/category-mapping'
import { placeIntents, scoreCandidate, visitDurationFor, type SideQuestIntent } from '@/lib/sidequest/recommendation'

const LIVE_CATEGORIES: Partial<Record<SideQuestIntent, string[]>> = {
  EAT: ['catering.restaurant','catering.cafe','catering.fast_food','catering.food_court','catering.ice_cream'],
  DRINKS: ['catering.bar','catering.pub','catering.taproom','catering.biergarten'],
  GAMES: ['entertainment.amusement_arcade','entertainment.bowling_alley','entertainment.escape_game','entertainment.miniature_golf','entertainment.activity_park.climbing','entertainment.activity_park.trampoline'],
  SHOPPING: ['commercial.shopping_mall','commercial.department_store','commercial.marketplace','commercial.clothing','commercial.books','commercial.toy_and_game','commercial.video_and_music'],
  ACTIVE: ['sport','entertainment.activity_park.climbing','entertainment.activity_park.trampoline'],
  CULTURE: ['entertainment.museum','entertainment.culture.gallery','entertainment.culture.theatre','entertainment.culture.arts_centre'],
  CINEMA: ['entertainment.cinema','entertainment.culture.theatre'],
}

function inferredLiveMeta(categories: string[], name: string) {
  const text = `${categories.join(' ')} ${name}`.toLowerCase()
  if (/shopping_mall|department_store|marketplace|commercial\.clothing|commercial\.books|toy_and_game|video_and_music/.test(text)) return { activity: 'Shopping', group: 'Shopping', genres: ['Social','Chill','Indoor'], band: 'SPEND_OPTIONAL', min: 0, max: null, duration: 60, quality: 'PRIMARY_DESTINATION' }
  if (/amusement_arcade/.test(text)) return { activity: 'Arcade', group: 'Entertainment', genres: ['Chaotic','Competitive','Social','Indoor'], band: '£', min: 5, max: 20, duration: 60, quality: 'PRIMARY_DESTINATION' }
  if (/bowling_alley/.test(text)) return { activity: 'Bowling', group: 'Entertainment', genres: ['Competitive','Social','Group','Indoor'], band: '££', min: 12, max: 30, duration: 75, quality: 'PRIMARY_DESTINATION' }
  if (/miniature_golf/.test(text)) return { activity: 'Mini Golf', group: 'Entertainment', genres: ['Competitive','Social','Date'], band: '££', min: 10, max: 25, duration: 60, quality: 'PRIMARY_DESTINATION' }
  if (/escape_game/.test(text)) return { activity: 'Escape Room', group: 'Entertainment', genres: ['Competitive','Adventure','Group','Indoor'], band: '£££', min: 20, max: 40, duration: 60, quality: 'PRIMARY_DESTINATION' }
  if (/climbing|trampoline|^sport|\.sport/.test(text)) return { activity: 'Active', group: 'Active', genres: ['Active','Adventure','Competitive','Group'], band: '££', min: 12, max: 25, duration: 75, quality: 'PRIMARY_DESTINATION' }
  if (/cinema/.test(text)) return { activity: 'Cinema', group: 'Entertainment', genres: ['Chill','Date','Indoor','Rainy-day'], band: '££', min: 10, max: 20, duration: 120, quality: 'PRIMARY_DESTINATION' }
  if (/museum/.test(text)) return { activity: 'Museum', group: 'Culture', genres: ['Creative','Chill','Indoor','Rainy-day'], band: 'UNKNOWN', min: null, max: null, duration: 90, quality: 'CULTURAL_DESTINATION' }
  if (/gallery|theatre|arts_centre/.test(text)) return { activity: /theatre/.test(text) ? 'Theatre' : 'Gallery', group: 'Culture', genres: ['Creative','Date','Indoor'], band: /theatre/.test(text) ? '£££' : 'UNKNOWN', min: /theatre/.test(text) ? 25 : null, max: /theatre/.test(text) ? 50 : null, duration: 90, quality: 'CULTURAL_DESTINATION' }
  if (/bar|pub|taproom|biergarten/.test(text)) return { activity: /bar/.test(text) ? 'Bar' : 'Pub', group: 'Nightlife', genres: ['Social','Nightlife','Group','Indoor'], band: '££', min: 10, max: 30, duration: 60, quality: 'NIGHTLIFE_DESTINATION' }
  if (/cafe|ice_cream/.test(text)) return { activity: 'Cafe', group: 'Food', genres: ['Foodie','Chill','Date','Indoor'], band: '£', min: 4, max: 15, duration: 40, quality: 'FOOD_DESTINATION' }
  return { activity: 'Restaurant', group: 'Food', genres: ['Foodie','Social','Date','Indoor'], band: '££', min: 15, max: 30, duration: 70, quality: 'FOOD_DESTINATION' }
}

async function liveFallback(area: ReturnType<typeof getArea>, intent: SideQuestIntent): Promise<NormalizedCataloguePlace[]> {
  if (!area || !LIVE_CATEGORIES[intent]) return []
  try {
    const records = await geoapifyPlacesProvider.searchNearby({
      query: area.name,
      latitude: area.centreLatitude,
      longitude: area.centreLongitude,
      radiusMeters: 3500,
      includedTypes: LIVE_CATEGORIES[intent],
    })
    return records.flatMap((place) => {
      if (!place.name || place.name === 'Unnamed place' || place.latitude == null || place.longitude == null) return []
      const meta = inferredLiveMeta(place.subcategories, place.name)
      return [{
        id: `geoapify-${place.providerPlaceId}`,
        name: place.name,
        formattedAddress: place.formattedAddress || place.shortAddress || null,
        postcode: (place.formattedAddress.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0] ?? null),
        latitude: place.latitude,
        longitude: place.longitude,
        activity: meta.activity,
        activityGroup: meta.group,
        genres: meta.genres,
        priceBand: meta.band,
        priceSource: meta.band === 'UNKNOWN' ? 'UNKNOWN' : 'CATEGORY_ESTIMATE',
        estimatedPriceMin: meta.min,
        estimatedPriceMax: meta.max,
        typicalDurationMinutes: meta.duration,
        area: area.name,
        quality: meta.quality,
      } satisfies NormalizedCataloguePlace]
    })
  } catch (error) {
    console.warn('[SideQuest] live category fallback failed', error)
    return []
  }
}

function priceLabel(place: NormalizedCataloguePlace) {
  if (place.priceBand === 'SPEND_OPTIONAL') return 'SPEND OPTIONAL'
  return formatPrice(place.priceSource === 'UNKNOWN' ? 'unknown' : place.priceBand === 'FREE' ? 'free' : 'estimated', place.estimatedPriceMin, place.estimatedPriceMax) + (place.priceSource === 'CATEGORY_ESTIMATE' && place.priceBand !== 'FREE' ? ' PP' : '')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const authResult = await withTimeout(
      supabase.auth.getUser(),
      5000,
      'Login verification took too long',
    )
    const user = authResult.data.user
    if (!user) return NextResponse.json({ error: 'Sign in to generate a SideQuest.' }, { status: 401 })

    const body = await request.json() as { location?: string; area?: string; budget?: string; time?: string; people?: string; vibes?: string[]; intent?: SideQuestIntent; transport?: string; excludePlaceIds?: string[] }
    const areaName = body.area?.trim()
    if (!areaName) return NextResponse.json({ error: 'Choose an area before generating your SideQuest.' }, { status: 400 })
    const area = getArea(areaName)
    if (!area) return NextResponse.json({ error: 'Choose one of the available London areas.' }, { status: 400 })

    const budget = Math.max(0, Number(body.budget ?? 10))
    const duration = Math.max(30, Number(body.time ?? 120))
    const people = Math.max(1, Number(body.people ?? 1))
    const vibes = body.vibes ?? []
    const intent: SideQuestIntent = body.intent ?? 'SURPRISE'

    // One successful free quest per account. If the subscription table has not
    // been migrated yet, generation still works and the UI reports the missing
    // persistence feature instead of silently breaking location matching.
    let entitlement: { plan?: string; quests_used?: number } | null = null
    const entitlementResult = await withTimeout(
      supabase.from('subscriptions').select('plan,quests_used').eq('user_id', user.id).maybeSingle(),
      4000,
      'Subscription check took too long',
    ).catch(() => ({ data: null, error: { message: 'Subscription check unavailable' } }))
    if (!entitlementResult.error) {
      entitlement = entitlementResult.data
      if (!entitlement) {
        const created = await withTimeout(
          supabase.from('subscriptions').insert({ user_id: user.id, plan: 'free', status: 'active', quests_used: 0 }).select('plan,quests_used').single(),
          4000,
          'Subscription setup took too long',
        ).catch(() => ({ data: null, error: { message: 'Subscription setup unavailable' } }))
        if (!created.error) entitlement = created.data
      }
      if ((entitlement?.plan ?? 'free') === 'free' && (entitlement?.quests_used ?? 0) >= 1) {
        return NextResponse.json({ error: "You've used your free SideQuest. SideQuest Plus is coming soon.", upgradeRequired: true }, { status: 402 })
      }
    }

    let candidates = getAreaPlaces(area.name)
      .filter((place) => place.usable)
      .map(normalizeCataloguePlace)
      .filter((place): place is NormalizedCataloguePlace => Boolean(place))

    // Prefer fully displayable venues. Every current area has hundreds of
    // address-complete catalogue entries, so users should not see "Address unavailable"
    // when a real addressed alternative exists.
    const addressComplete = candidates.filter((place) => Boolean(place.formattedAddress && place.postcode))
    if (addressComplete.length >= 100) candidates = addressComplete

    const intentMatches = intent === 'SURPRISE' ? candidates : candidates.filter((p) => placeIntents(p).includes(intent))
    if (intent !== 'SURPRISE' && intentMatches.length < 8) {
      const live = await liveFallback(area, intent)
      const seen = new Set(candidates.map((p) => p.id))
      candidates = [...candidates, ...live.filter((p) => !seen.has(p.id))]
    }

    const scored = candidates
      .map((place) => ({ place, score: scoreCandidate(place, { intent, vibes, budget, excludePlaceIds: body.excludePlaceIds }) }))
      .filter(({ place, score }) => score > -1000 && visitDurationFor(place, duration) > 0)
      .sort((a, b) => b.score - a.score)

    if (!scored.length) {
      const label = intent === 'SURPRISE' ? 'destination' : intent.replaceAll('_', ' ').toLowerCase()
      return NextResponse.json({ error: `We couldn't find a ${label} option in ${area.name} that fits those settings. Try more time, budget, or Surprise me.` }, { status: 422 })
    }

    const desiredStops = duration <= 60 ? 1 : duration <= 180 ? 2 : duration <= 300 ? 3 : 4
    const selected: Array<{ place: NormalizedCataloguePlace; duration: number }> = []
    let remaining = duration
    for (const { place } of scored) {
      if (selected.length >= desiredStops) break
      const visit = visitDurationFor(place, remaining)
      if (!visit) continue
      // Reserve a small inter-stop allowance after the first stop.
      const reserve = selected.length === 0 ? 0 : 10
      if (visit + reserve > remaining) continue
      selected.push({ place, duration: visit })
      remaining -= visit + reserve
    }
    if (!selected.length) return NextResponse.json({ error: `We couldn't build a SideQuest that genuinely fits into ${duration} minutes.` }, { status: 422 })

    const steps = selected.map(({ place, duration: stopDuration }, index) => ({
      number: index + 1,
      title: 'GO TO',
      placeId: place.id,
      name: place.name,
      venueName: place.name,
      address: place.formattedAddress,
      postcode: place.postcode,
      activity: place.activity,
      activityGroup: place.activityGroup,
      intents: placeIntents(place),
      genres: place.genres,
      tags: place.genres,
      description: `A ${place.activity.toLowerCase()} stop chosen for your ${intent === 'SURPRISE' ? (vibes[0] ?? 'SideQuest') : intent.toLowerCase()} brief.`,
      duration: stopDuration,
      cost: place.estimatedPriceMin,
      priceStatus: place.priceSource === 'UNKNOWN' ? 'unknown' : place.priceBand === 'FREE' ? 'free' : 'estimated',
      priceLabel: priceLabel(place),
      place,
    }))

    const knownMin = selected.reduce((sum, { place }) => sum + (place.estimatedPriceMin ?? 0), 0)
    const knownMax = selected.reduce((sum, { place }) => sum + (place.estimatedPriceMax ?? place.estimatedPriceMin ?? 0), 0)
    const allFree = selected.every(({ place }) => place.priceBand === 'FREE')
    const anyUnknown = selected.some(({ place }) => place.priceSource === 'UNKNOWN')
    const costLabel = allFree ? 'FREE' : anyUnknown ? `EST. £${knownMin}–£${knownMax} PP + unknowns` : `EST. £${knownMin}–£${knownMax} PP`

    const questId = crypto.randomUUID()
    const quest = {
      id: questId,
      title: `The ${area.name} ${intent === 'SURPRISE' ? (vibes[0] ?? 'Discovery') : intent === 'EAT' ? 'Food' : intent === 'GAMES' ? 'Games' : intent === 'DRINKS' ? 'Drinks' : intent === 'SHOPPING' ? 'Shopping' : intent === 'ACTIVE' ? 'Active' : intent === 'CULTURE' ? 'Culture' : intent === 'CINEMA' ? 'Cinema' : intent === 'NIGHTLIFE' ? 'Nightlife' : 'Outdoor'} Quest`,
      city: 'London', location: area.name, budget, timeMinutes: duration,
      difficulty: Number((5 + Math.min(4, selected.length)).toFixed(1)), vibes, intent,
      totalCost: knownMin, estimatedCostMin: knownMin, estimatedCostMax: knownMax, costLabel,
      start: { name: `${area.name} starting point`, latitude: area.centreLatitude, longitude: area.centreLongitude, formattedAddress: `${area.name}, London`, city: 'London' },
      steps, source: 'SideQuest catalogue + Geoapify category fallback', generatedAt: new Date().toISOString(), transport: body.transport ?? 'best', catalogueCount: candidates.length,
    }

    // Persist successful quests so Profile / History / Saved can show them again.
    // We only consume the free entitlement after a successful quest insert.
    const questInsert = await withTimeout(
      supabase.from('quests').insert({
        id: questId,
        user_id: user.id,
        title: quest.title,
        city: 'London',
        area: area.name,
        budget,
        time_minutes: duration,
        people,
        vibes,
        total_cost: knownMin,
        difficulty: quest.difficulty,
      }),
      4000,
      'Saving quest took too long',
    ).catch(() => ({ error: { message: 'Quest persistence unavailable' } }))

    if (!questInsert.error) {
      await withTimeout(
        supabase.from('quest_stops').insert(steps.map((step) => ({
          quest_id: questId,
          activity_id: null,
          stop_number: step.number,
          title: step.name,
          description: JSON.stringify({
            placeId: step.placeId,
            address: step.address,
            postcode: step.postcode,
            activity: step.activity,
            activityGroup: step.activityGroup,
            intents: step.intents,
            genres: step.genres,
            priceLabel: step.priceLabel,
            place: step.place,
          }),
          duration_minutes: step.duration,
          cost: step.cost ?? 0,
        }))),
        4000,
        'Saving quest stops took too long',
      ).catch(() => null)

      if (!entitlementResult.error && (entitlement?.plan ?? 'free') === 'free') {
        await withTimeout(
          supabase.from('subscriptions').update({ quests_used: (entitlement?.quests_used ?? 0) + 1 }).eq('user_id', user.id),
          4000,
          'Updating free quest usage took too long',
        ).catch(() => null)
      }
    }

    return NextResponse.json({ quest, persisted: !questInsert.error })
  } catch (error) {
    console.error('[SideQuest] generation failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quest generation failed.' }, { status: 503 })
  }
}
