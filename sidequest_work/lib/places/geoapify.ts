import type { PlaceProvider, PlaceRecord, PlaceSearchParams } from './types'

const GEOAPIFY_URL = 'https://api.geoapify.com'

function apiKey() {
  const key = process.env.GEOAPIFY_API_KEY
  if (!key) throw new Error('GEOAPIFY_API_KEY is not configured')
  return key
}

function mapFeature(feature: Record<string, unknown>): PlaceRecord {
  const properties = (feature.properties ?? {}) as Record<string, unknown>
  const coordinates = Array.isArray((feature.geometry as Record<string, unknown> | undefined)?.coordinates)
    ? (feature.geometry as { coordinates: unknown[] }).coordinates
    : []
  const placeId = String(properties.place_id ?? feature.id ?? '')
  const categories = Array.isArray(properties.categories) ? properties.categories.map(String) : []
  const name = String(properties.name ?? properties.address_line1 ?? 'Unnamed place')
  const latitude = typeof properties.lat === 'number' ? properties.lat : typeof coordinates[1] === 'number' ? coordinates[1] : undefined
  const longitude = typeof properties.lon === 'number' ? properties.lon : typeof coordinates[0] === 'number' ? coordinates[0] : undefined

  return {
    id: placeId,
    provider: 'geoapify',
    providerPlaceId: placeId,
    name,
    formattedAddress: String(properties.formatted ?? properties.address_line2 ?? ''),
    shortAddress: typeof properties.address_line2 === 'string' ? properties.address_line2 : undefined,
    city: String(properties.city ?? 'London'),
    area: String(properties.suburb ?? properties.district ?? ''),
    neighbourhood: typeof properties.neighbourhood === 'string' ? properties.neighbourhood : undefined,
    category: categories[0] ?? 'place',
    subcategories: categories,
    tags: categories,
    currency: 'GBP',
    latitude,
    longitude,
    websiteUrl: typeof properties.website === 'string' ? properties.website : undefined,
    googleMapsUrl: latitude != null && longitude != null ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : undefined,
    sourceUrl: typeof properties.datasource === 'object' && properties.datasource !== null && typeof (properties.datasource as Record<string, unknown>).raw === 'string' ? String((properties.datasource as Record<string, unknown>).raw) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
    sourceName: 'Geoapify Places',
    verified: Boolean(placeId),
    lastVerified: new Date().toISOString(),
  }
}

async function request(path: string, params: URLSearchParams) {
  params.set('apiKey', apiKey())
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${GEOAPIFY_URL}${path}?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Geoapify request failed: ${response.status}`)
    return response.json() as Promise<{ features?: Record<string, unknown>[] }>
  } finally {
    clearTimeout(timer)
  }
}

export const geoapifyPlacesProvider: PlaceProvider = {
  async searchText(params) {
    const search = new URLSearchParams({ text: params.query, limit: '20', format: 'geojson' })
    const data = await request('/v1/geocode/search', search)
    return (data.features ?? []).map(mapFeature)
  },
  async searchNearby(params) {
    if (params.latitude == null || params.longitude == null) return []
    const search = new URLSearchParams({ categories: (params.includedTypes ?? ['entertainment', 'tourism', 'catering']).join(','), filter: `circle:${params.longitude},${params.latitude},${params.radiusMeters ?? 2500}`, bias: `proximity:${params.longitude},${params.latitude}`, limit: '50', lang: 'en' })
    const data = await request('/v2/places', search)
    return (data.features ?? []).map(mapFeature)
  },
  async getPlaceDetails(placeId) {
    const search = new URLSearchParams({ place_id: placeId, format: 'geojson' })
    const data = await request('/v1/geocode/search', search)
    return data.features?.[0] ? mapFeature(data.features[0]) : null
  },
  async getPlacePhotos() {
    return []
  },
}
