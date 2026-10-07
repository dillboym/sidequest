import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type CataloguePlace = {
  id: string; name: string; address: { formatted: string | null; street: string | null; postcode: string | null; city: string }; coordinates: { lat: number; lng: number }; primaryArea: string; eligibleAreas: string[]; activity: string; activityGroup: string; genres: string[]; price: { band: string; min: number | null; max: number | null; source: string }; typicalDurationMinutes: number; indoor: boolean | null; outdoor: boolean | null; quality: string; usable: boolean
}
export type CatalogueArea = { id: string; name: string; slug: string; city: string; centreLatitude: number; centreLongitude: number; initialRadiusKm: number; maximumRadiusKm: number }
export type NormalizedCataloguePlace = { id: string; name: string; formattedAddress: string | null; postcode: string | null; latitude: number; longitude: number; activity: string; activityGroup: string; genres: string[]; priceBand: string; priceSource: string; estimatedPriceMin: number | null; estimatedPriceMax: number | null; typicalDurationMinutes: number; area: string; quality: string }

export function normalizeCataloguePlace(place: CataloguePlace): NormalizedCataloguePlace | null {
  const latitude = Number(place.coordinates?.lat)
  const longitude = Number(place.coordinates?.lng)
  if (!place.id || !place.name?.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !place.activity?.trim()) return null
  return { id: place.id, name: place.name.trim(), formattedAddress: place.address?.formatted?.trim() || null, postcode: place.address?.postcode?.trim() || null, latitude, longitude, activity: place.activity.trim(), activityGroup: place.activityGroup?.trim() || 'Other', genres: Array.isArray(place.genres) ? place.genres.filter(Boolean) : [], priceBand: place.price?.band || 'UNKNOWN', priceSource: place.price?.source || 'UNKNOWN', estimatedPriceMin: place.price?.min ?? null, estimatedPriceMax: place.price?.max ?? null, typicalDurationMinutes: Math.max(5, Number(place.typicalDurationMinutes) || 30), area: place.primaryArea, quality: place.quality || 'SECONDARY_DESTINATION' }
}

type CatalogueFile = { places: Record<string, CataloguePlace> }
const readJson = <T>(file: string) => JSON.parse(readFileSync(join(process.cwd(), file), 'utf8')) as T

export function getArea(areaName: string): CatalogueArea | undefined {
  const areas = readJson<Record<string, CatalogueArea>>('data/sidequest/areas.json')
  return Object.values(areas).find((area) => area.name.toLowerCase() === areaName.toLowerCase() || area.slug.toLowerCase() === areaName.toLowerCase())
}

export function getAreaPlaces(areaName: string): CataloguePlace[] {
  const area = getArea(areaName)
  if (!area) return []
  const places = readJson<CatalogueFile>('data/sidequest/places.json').places
  const ids = readJson<string[]>(`data/sidequest/areas/${area.slug}.json`)
  return ids.map((id) => places[id]).filter((place): place is CataloguePlace => Boolean(place))
}
