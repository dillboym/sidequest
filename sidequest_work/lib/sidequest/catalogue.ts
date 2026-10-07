import placesJson from '@/data/sidequest/places.json'
import areasJson from '@/data/sidequest/areas.json'
import victoriaIds from '@/data/sidequest/areas/victoria.json'
import shoreditchIds from '@/data/sidequest/areas/shoreditch.json'
import southBankIds from '@/data/sidequest/areas/south-bank.json'
import sohoIds from '@/data/sidequest/areas/soho.json'
import coventGardenIds from '@/data/sidequest/areas/covent-garden.json'
import camdenIds from '@/data/sidequest/areas/camden.json'
import brixtonIds from '@/data/sidequest/areas/brixton.json'
import greenwichIds from '@/data/sidequest/areas/greenwich.json'
import greenwichPeninsulaIds from '@/data/sidequest/areas/greenwich-peninsula.json'
import northGreenwichIds from '@/data/sidequest/areas/north-greenwich.json'
import nottingHillIds from '@/data/sidequest/areas/notting-hill.json'
import canaryWharfIds from '@/data/sidequest/areas/canary-wharf.json'
import islingtonIds from '@/data/sidequest/areas/islington.json'
import hackneyIds from '@/data/sidequest/areas/hackney.json'

export type CataloguePlace = {
  id: string
  name: string
  address: {
    formatted: string | null
    street: string | null
    postcode: string | null
    city: string
  }
  coordinates: { lat: number; lng: number }
  primaryArea: string
  eligibleAreas: string[]
  activity: string
  activityGroup: string
  genres: string[]
  price: {
    band: string
    min: number | null
    max: number | null
    source: string
  }
  typicalDurationMinutes: number
  indoor: boolean | null
  outdoor: boolean | null
  quality: string
  usable: boolean
}

export type CatalogueArea = {
  id: string
  name: string
  slug: string
  city: string
  centreLatitude: number
  centreLongitude: number
  initialRadiusKm: number
  maximumRadiusKm: number
}

export type NormalizedCataloguePlace = {
  id: string
  name: string
  formattedAddress: string | null
  postcode: string | null
  latitude: number
  longitude: number
  activity: string
  activityGroup: string
  genres: string[]
  priceBand: string
  priceSource: string
  estimatedPriceMin: number | null
  estimatedPriceMax: number | null
  typicalDurationMinutes: number
  area: string
  quality: string
}

type CatalogueFile = { places: Record<string, CataloguePlace> }

export function normalizeCataloguePlace(place: CataloguePlace): NormalizedCataloguePlace | null {
  const latitude = Number(place.coordinates?.lat)
  const longitude = Number(place.coordinates?.lng)

  if (
    !place.id ||
    !place.name?.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !place.activity?.trim()
  ) {
    return null
  }

  return {
    id: place.id,
    name: place.name.trim(),
    formattedAddress: place.address?.formatted?.trim() || null,
    postcode: place.address?.postcode?.trim() || null,
    latitude,
    longitude,
    activity: place.activity.trim(),
    activityGroup: place.activityGroup?.trim() || 'Other',
    genres: Array.isArray(place.genres) ? place.genres.filter(Boolean) : [],
    priceBand: place.price?.band || 'UNKNOWN',
    priceSource: place.price?.source || 'UNKNOWN',
    estimatedPriceMin: place.price?.min ?? null,
    estimatedPriceMax: place.price?.max ?? null,
    typicalDurationMinutes: Math.max(5, Number(place.typicalDurationMinutes) || 30),
    area: place.primaryArea,
    quality: place.quality || 'SECONDARY_DESTINATION',
  }
}

const areas = areasJson as Record<string, CatalogueArea>
const places = (placesJson as CatalogueFile).places

const areaPlaceIds: Record<string, string[]> = {
  victoria: victoriaIds,
  shoreditch: shoreditchIds,
  'south-bank': southBankIds,
  soho: sohoIds,
  'covent-garden': coventGardenIds,
  camden: camdenIds,
  brixton: brixtonIds,
  greenwich: greenwichIds,
  'greenwich-peninsula': greenwichPeninsulaIds,
  'north-greenwich': northGreenwichIds,
  'notting-hill': nottingHillIds,
  'canary-wharf': canaryWharfIds,
  islington: islingtonIds,
  hackney: hackneyIds,
}

export function getArea(areaName: string): CatalogueArea | undefined {
  const normalized = areaName.trim().toLowerCase()
  return Object.values(areas).find(
    (area) =>
      area.name.toLowerCase() === normalized ||
      area.slug.toLowerCase() === normalized,
  )
}

export function getAreaPlaces(areaName: string): CataloguePlace[] {
  const area = getArea(areaName)
  if (!area) return []

  const ids = areaPlaceIds[area.slug] ?? []
  return ids
    .map((id) => places[id])
    .filter((place): place is CataloguePlace => Boolean(place))
}
