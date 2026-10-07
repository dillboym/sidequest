import type { PlaceProvider, PlaceRecord, PlaceSearchParams } from './types'

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1'

function headers() {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not configured')
  return { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key }
}

function mapPlace(place: Record<string, unknown>): PlaceRecord {
  const displayName = place.displayName as { text?: string } | undefined
  const location = place.location as { latitude?: number; longitude?: number } | undefined
  const id = String(place.id ?? '')
  return {
    id,
    provider: 'google',
    providerPlaceId: id,
    name: displayName?.text ?? 'Unnamed place',
    formattedAddress: String(place.formattedAddress ?? ''),
    city: 'London',
    area: '',
    category: Array.isArray(place.types) ? String(place.types[0] ?? 'place') : 'place',
    subcategories: Array.isArray(place.types) ? place.types.map(String) : [],
    tags: [],
    currency: 'GBP',
    latitude: location?.latitude,
    longitude: location?.longitude,
    websiteUrl: typeof place.websiteUri === 'string' ? place.websiteUri : undefined,
    googleMapsUrl: typeof place.googleMapsUri === 'string' ? place.googleMapsUri : undefined,
    sourceUrl: typeof place.googleMapsUri === 'string' ? place.googleMapsUri : `https://www.google.com/maps/search/?api=1&query=place_id:${id}`,
    sourceName: 'Google Places',
    verified: Boolean(id),
    lastVerified: new Date().toISOString(),
  }
}

async function request(path: string, body: Record<string, unknown>, fieldMask: string) {
  const response = await fetch(`${GOOGLE_PLACES_URL}/${path}`, {
    method: 'POST',
    headers: { ...headers(), 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Google Places request failed: ${response.status}`)
  return response.json() as Promise<Record<string, unknown>>
}

export const googlePlacesProvider: PlaceProvider = {
  async searchText(params) {
    const data = await request('places:searchText', { textQuery: params.query, pageSize: 20 }, 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.googleMapsUri')
    return Array.isArray(data.places) ? data.places.map((place) => mapPlace(place as Record<string, unknown>)) : []
  },
  async searchNearby(params) {
    if (!params.latitude || !params.longitude) return []
    const data = await request('places:searchNearby', { includedTypes: params.includedTypes ?? ['tourist_attraction'], maxResultCount: 20, locationRestriction: { circle: { center: { latitude: params.latitude, longitude: params.longitude }, radius: params.radiusMeters ?? 2500 } } }, 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.googleMapsUri')
    return Array.isArray(data.places) ? data.places.map((place) => mapPlace(place as Record<string, unknown>)) : []
  },
  async getPlaceDetails(placeId) {
    const response = await fetch(`${GOOGLE_PLACES_URL}/places/${encodeURIComponent(placeId)}`, { headers: { ...headers(), 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,websiteUri,googleMapsUri' }, cache: 'no-store' })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Google Place details failed: ${response.status}`)
    return mapPlace(await response.json())
  },
  async getPlacePhotos() {
    return []
  },
}
