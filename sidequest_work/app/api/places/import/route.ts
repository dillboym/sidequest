import { NextResponse } from 'next/server'
import { geoapifyPlacesProvider } from '@/lib/places/geoapify'
import { createAdminClient } from '@/lib/supabase/admin'
import { AREA_ALIASES, LONDON_AREAS } from '@/lib/mockData'

const CATEGORY_QUERIES = ['bowling', 'arcade', 'mini golf', 'escape room', 'cinema', 'museum', 'gallery', 'park', 'cafe', 'restaurant', 'dessert', 'pub', 'live music', 'karaoke', 'climbing', 'padel', 'market', 'bookshop']

export async function POST(request: Request) {
  try {
    const body = await request.json() as { city?: string; area?: string; radiusMeters?: number; category?: string; bulk?: boolean }
    if (body.city && body.city !== 'London') return NextResponse.json({ error: 'The prototype importer currently supports London only.' }, { status: 400 })
    const selectedArea = body.area?.trim()
    if (!selectedArea || !LONDON_AREAS.some((area) => area.name === selectedArea)) return NextResponse.json({ error: 'Choose an active London area.' }, { status: 400 })
    const queries = body.bulk ? (AREA_ALIASES[selectedArea] ?? [selectedArea]).flatMap((alias) => CATEGORY_QUERIES.map((category) => `${category} ${alias}, London`)) : [`${body.category?.trim() || 'things to do'} ${selectedArea}, London`]
    const unique = new Map<string, Awaited<ReturnType<typeof geoapifyPlacesProvider.searchText>>[number]>()
    for (const query of queries.slice(0, body.bulk ? 60 : 1)) {
      const places = await geoapifyPlacesProvider.searchText({ query, radiusMeters: body.radiusMeters ?? 2000 })
      for (const place of places) unique.set(place.providerPlaceId, { ...place, area: selectedArea })
    }
    const places = [...unique.values()]
    let inserted = 0
    let updated = 0
    if (places.length) {
      const admin = createAdminClient()
      const { data, error } = await admin.from('activities').upsert(places.map((place) => ({ provider: place.provider, provider_place_id: place.providerPlaceId, name: place.name, formatted_address: place.formattedAddress, short_address: place.shortAddress, city: place.city, area: place.area, neighbourhood: place.neighbourhood, latitude: place.latitude, longitude: place.longitude, category: place.category, subcategories: place.subcategories, kind: place.category, tags: place.tags, description: place.description, price_level: place.priceLevel, price_min: place.priceMin, price_max: place.priceMax, currency: place.currency, duration_minutes: place.typicalDurationMinutes ?? 60, age_min: place.ageMin, age_max: place.ageMax, age_restriction: place.ageRestriction, opening_hours: place.openingHours, website_url: place.websiteUrl, google_maps_url: place.googleMapsUrl, source_url: place.sourceUrl, source_name: place.sourceName, verified: place.verified, last_verified: place.lastVerified })), { onConflict: 'provider_place_id', ignoreDuplicates: false }).select('id')
      if (error) throw error
      inserted = data?.length ?? 0
      updated = Math.max(0, places.length - inserted)
    }
    return NextResponse.json({ area: selectedArea, queriesRun: Math.min(queries.length, body.bulk ? 60 : 1), placesFound: places.length, duplicatesRemoved: Math.max(0, queries.length * 20 - places.length), inserted, updated, placesWithoutPhotos: places.length, placesWithoutPrices: places.filter((place) => place.priceMin == null).length, placesRequiringVerification: places.filter((place) => !place.verified).length, places })
  } catch (error) {
    console.error('[v0] place import failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed. Check Google Places and Supabase server configuration.' }, { status: 503 })
  }
}
