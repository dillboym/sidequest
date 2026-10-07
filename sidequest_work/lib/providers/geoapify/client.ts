const BASE_URL = 'https://api.geoapify.com/v1'

export function geoapifyKey() {
  const key = process.env.GEOAPIFY_API_KEY
  if (!key) throw new Error('GEOAPIFY_API_KEY is not configured')
  return key
}

export async function geoapifyRequest(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams({ apiKey: geoapifyKey() })
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value))
  const response = await fetch(`${BASE_URL}/${path}?${search}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Geoapify request failed: ${response.status} ${await response.text()}`)
  return response.json() as Promise<Record<string, unknown>>
}

export function geoapifyTileUrl() {
  return `${BASE_URL}/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(geoapifyKey())}`
}

export function geoapifyRouteUrl() {
  return `${BASE_URL}/route`
}

export async function calculateRoute(points: { latitude: number; longitude: number }[], mode: 'walk' | 'drive' | 'bicycle' = 'walk') {
  if (points.length < 2) throw new Error('A route needs at least two points')
  const waypoints = points.map((point) => `${point.latitude},${point.longitude}`).join('|')
  return geoapifyRequest('routing', { waypoints, mode: mode === 'walk' ? 'walk' : mode === 'bicycle' ? 'bicycle' : 'drive', type: 'short' })
}

export async function geocodeLocation(text: string) {
  return geoapifyRequest('geocode/search', { text, format: 'geojson', limit: 5 })
}

export async function searchNearbyPlaces(latitude: number, longitude: number, radiusMeters: number, categories: string) {
  return geoapifyRequest('places', { categories, filter: `circle:${longitude},${latitude},${radiusMeters}`, limit: 100 })
}

export async function searchPlacesByCategory(text: string, categories: string, radiusMeters = 2500) {
  const geo = await geocodeLocation(text) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> }
  const [longitude, latitude] = geo.features?.[0]?.geometry?.coordinates ?? []
  if (latitude == null || longitude == null) throw new Error(`Geoapify could not geocode ${text}`)
  return searchNearbyPlaces(latitude, longitude, radiusMeters, categories)
}

export async function calculateMultiStopRoute(points: { latitude: number; longitude: number }[], mode: 'walk' | 'drive' | 'bicycle' = 'walk') {
  return calculateRoute(points, mode)
}

export function toGeoapifyMapFeature(feature: Record<string, unknown>) {
  const properties = (feature.properties ?? {}) as Record<string, unknown>
  const coordinates = ((feature.geometry ?? {}) as { coordinates?: [number, number] }).coordinates
  return { provider: 'geoapify' as const, providerPlaceId: String(properties.place_id ?? properties.datasource ?? ''), name: String(properties.name ?? 'Unnamed place'), formattedAddress: String(properties.formatted ?? properties.address_line2 ?? ''), longitude: coordinates?.[0], latitude: coordinates?.[1], category: String(properties.categories?.toString().split(',')[0] ?? 'place'), sourceUrl: typeof properties.website === 'string' ? properties.website : undefined }
}

export { geoapifyKey as getGeoapifyKey }

export async function getPlaceDetails(placeId: string) {
  return geoapifyRequest('place-details', { id: placeId })
}

export async function searchNearbyPlacesByCategory(latitude: number, longitude: number, radiusMeters: number, categories: string) {
  return searchNearbyPlaces(latitude, longitude, radiusMeters, categories)
}

export async function getGeoapifyTileUrl() {
  return geoapifyTileUrl()
}

export async function getGeoapifyRoute(points: { latitude: number; longitude: number }[], mode: 'walk' | 'drive' | 'bicycle' = 'walk') {
  return calculateRoute(points, mode)
}

export async function getGeoapifyGeocode(text: string) {
  return geocodeLocation(text)
}

export async function getGeoapifyPlaces(latitude: number, longitude: number, radiusMeters: number, categories: string) {
  return searchNearbyPlaces(latitude, longitude, radiusMeters, categories)
}

export async function getGeoapifyDetails(placeId: string) {
  return getPlaceDetails(placeId)
}

export async function getGeoapifyRouteGeometry(points: { latitude: number; longitude: number }[], mode: 'walk' | 'drive' | 'bicycle' = 'walk') {
  return calculateMultiStopRoute(points, mode)
}

export async function getGeoapifySearch(text: string, categories: string, radiusMeters = 2500) {
  return searchPlacesByCategory(text, categories, radiusMeters)
}

export async function getGeoapifyProviderStatus() {
  const key = process.env.GEOAPIFY_API_KEY
  return { configured: Boolean(key), provider: 'geoapify' }
}

export async function testGeoapify() {
  await geocodeLocation('Greenwich, London')
  return { ok: true, provider: 'geoapify' }
}
