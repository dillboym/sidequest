export type PlaceRecord = {
  id: string
  provider: 'google' | 'geoapify'
  providerPlaceId: string
  name: string
  formattedAddress: string
  shortAddress?: string
  city: string
  area: string
  neighbourhood?: string
  latitude?: number
  longitude?: number
  category: string
  subcategories: string[]
  tags: string[]
  description?: string
  priceLevel?: number
  priceMin?: number
  priceMax?: number
  currency: string
  typicalDurationMinutes?: number
  ageMin?: number
  ageMax?: number
  ageRestriction?: string
  openingHours?: string[]
  websiteUrl?: string
  googleMapsUrl?: string
  photoUrl?: string
  photoAttribution?: string
  sourceUrl: string
  sourceName: string
  verified: boolean
  lastVerified?: string
}

export type PlaceSearchParams = {
  query: string
  area?: string
  latitude?: number
  longitude?: number
  radiusMeters?: number
  includedTypes?: string[]
}

export interface PlaceProvider {
  searchText(params: PlaceSearchParams): Promise<PlaceRecord[]>
  searchNearby(params: PlaceSearchParams): Promise<PlaceRecord[]>
  getPlaceDetails(placeId: string): Promise<PlaceRecord | null>
  getPlacePhotos(placeId: string): Promise<{ url: string; attribution?: string }[]>
}

export function toSideQuestTags(place: Pick<PlaceRecord, 'name' | 'category' | 'subcategories' | 'tags'>) {
  return Array.from(new Set([place.category, ...place.subcategories, ...place.tags].map((tag) => tag.trim().toLowerCase()).filter(Boolean)))
}

export function isPlaceEligible(place: PlaceRecord, age?: number) {
  if (!place.verified) return false
  if (typeof age === 'number' && ((place.ageMin && age < place.ageMin) || (place.ageMax && age > place.ageMax))) return false
  return true
}
