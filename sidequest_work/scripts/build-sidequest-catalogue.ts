import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parse } from 'csv-parse/sync'

const SOURCES = {
  mendeley: 'https://figshare.com/ndownloader/files/50292426',
  restaurants: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/restaurants.geojson',
  cafes: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/coffee.geojson',
  pubs: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/pubs.geojson',
  parks: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/parks.geojson',
  cinemas: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/cinemas.geojson',
  gyms: 'https://raw.githubusercontent.com/12ian34/loclocloc/main/public/data/gyms.geojson',
} as const

const AREAS = [
  ['victoria', 'Victoria', 51.4966, -0.1437], ['shoreditch', 'Shoreditch', 51.5265, -0.0815],
  ['south-bank', 'South Bank', 51.5055, -0.1132], ['soho', 'Soho', 51.5137, -0.1310],
  ['covent-garden', 'Covent Garden', 51.5117, -0.1240], ['camden', 'Camden', 51.5390, -0.1426],
  ['brixton', 'Brixton', 51.4613, -0.1156], ['greenwich', 'Greenwich', 51.4826, -0.0077],
  ['greenwich-peninsula', 'Greenwich Peninsula', 51.5005, 0.0037], ['north-greenwich', 'North Greenwich', 51.5008, 0.0032],
  ['notting-hill', 'Notting Hill', 51.5099, -0.2057], ['canary-wharf', 'Canary Wharf', 51.5054, -0.0235],
  ['islington', 'Islington', 51.5362, -0.1033], ['hackney', 'Hackney', 51.5450, -0.0553],
]

const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim()
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null
const haversine = (a: number, b: number, c: number, d: number) => {
  const r = 6371, rad = Math.PI / 180, x = (c - a) * rad, y = (d - b) * rad
  const q = Math.sin(x / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(y / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(q))
}

function classify(category: string, name: string, source: string) {
  const haystack = `${category} ${name}`.toLowerCase()
  if (source === 'parks' || /park|garden|green space|common/.test(haystack)) return { activity: 'Park', group: 'Outdoor', genres: ['Chill', 'Scenic', 'Outdoor', 'Budget'], band: 'FREE', min: 0, max: 0, duration: 60, quality: 'SCENIC_DESTINATION', indoor: false, outdoor: true }
  if (source === 'cafes' || /cafe|coffee|bakery/.test(haystack)) return { activity: 'Cafe', group: 'Food', genres: ['Foodie', 'Chill', 'Date', 'Indoor', 'Solo'], band: '£', min: 4, max: 15, duration: 45, quality: 'FOOD_DESTINATION', indoor: true, outdoor: false }
  if (source === 'pubs' || /pub|bar|taproom/.test(haystack)) return { activity: /bar|nightclub/.test(haystack) ? 'Bar' : 'Pub', group: 'Nightlife', genres: ['Social', 'Group', 'Nightlife', 'Indoor'], band: '££', min: 10, max: 30, duration: 75, quality: 'NIGHTLIFE_DESTINATION', indoor: true, outdoor: false }
  if (source === 'restaurants' || /restaurant|food|dining|pizza|eatery/.test(haystack)) return { activity: 'Restaurant', group: 'Food', genres: ['Foodie', 'Social', 'Date', 'Indoor'], band: '££', min: 15, max: 30, duration: 75, quality: 'FOOD_DESTINATION', indoor: true, outdoor: false }
  if (source === 'cinemas' || /cinema|movie/.test(haystack)) return { activity: 'Cinema', group: 'Entertainment', genres: ['Chill', 'Date', 'Indoor', 'Rainy-day'], band: '££', min: 10, max: 20, duration: 120, quality: 'PRIMARY_DESTINATION', indoor: true, outdoor: false }
  if (source === 'gyms' || /climb|boulder|fitness|sport|gym/.test(haystack)) return { activity: 'Active', group: 'Active', genres: ['Active', 'Adventure', 'Competitive', 'Group'], band: '££', min: 12, max: 25, duration: 90, quality: 'ACTIVE_DESTINATION', indoor: true, outdoor: false }
  if (/museum|gallery|theatre|landmark|historic|palace|attraction|monument/.test(haystack)) return { activity: /museum/.test(haystack) ? 'Museum' : 'Historic Attraction', group: 'Culture', genres: ['Creative', 'Chill', 'Date', 'Indoor'], band: 'UNKNOWN', min: null, max: null, duration: 90, quality: 'CULTURAL_DESTINATION', indoor: true, outdoor: false }
  return { activity: 'Other Activity', group: 'Other', genres: ['Discovery'], band: 'UNKNOWN', min: null, max: null, duration: 60, quality: 'SECONDARY_STOP', indoor: null, outdoor: null }
}

function geojsonRecords(source: string, json: any) {
  return (json.features ?? []).map((feature: any) => {
    const p = feature.properties ?? {}, coordinates = feature.geometry?.coordinates ?? []
    const lng = number(coordinates[0]), lat = number(coordinates[1]), name = clean(p.name || p.Name || p.title)
    if (!name || lat == null || lng == null) return null
    return { source: 'osm', sourceId: clean(p.osm_id || p.id || `${source}:${name}:${lat}:${lng}`), name, address: { formatted: clean([p.address, p.postcode, p.city].filter(Boolean).join(', ')) || null, street: clean(p.address) || null, postcode: clean(p.postcode) || null, city: 'London' }, coordinates: { lat, lng }, rawCategory: clean(p.amenity || p.leisure || p.tourism || source), sourceDataset: source }
  }).filter(Boolean)
}

async function fetchText(url: string) { const response = await fetch(url); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.text() }

async function main() {
const all: any[] = []
for (const [source, url] of Object.entries(SOURCES)) {
  try {
    const text = await fetchText(url)
    if (source === 'mendeley') {
      const rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true }) as any[]
      for (const row of rows) {
        const name = clean(row.name || row.Name || row.title), lat = number(row.latitude || row.lat), lng = number(row.longitude || row.lng)
        if (name && lat != null && lng != null) all.push({ source: 'mendeley', sourceId: clean(row.id || `mendeley:${name}:${lat}:${lng}`), name, address: { formatted: clean(row.address || row.Address) || null, street: null, postcode: null, city: 'London' }, coordinates: { lat, lng }, rawCategory: clean(row.category || row.Category), sourceDataset: 'mendeley' })
      }
    } else all.push(...geojsonRecords(source, JSON.parse(text)))
    console.log(`[catalogue] loaded ${source}`)
  } catch (error) { console.warn(`[catalogue] skipped ${source}: ${error instanceof Error ? error.message : error}`) }
}

const rejected = /^(stop|activity|attraction|nearby place|main stop)$/i
const unique = new Map<string, any>()
for (const item of all) {
  if (rejected.test(item.name) || item.name.length < 2) continue
  const key = `${item.name.toLowerCase()}|${item.coordinates.lat.toFixed(4)}|${item.coordinates.lng.toFixed(4)}`
  if (!unique.has(key)) unique.set(key, item)
}

const places: Record<string, any> = {}
for (const item of unique.values()) {
  const meta = classify(item.rawCategory, item.name, item.sourceDataset)
  const distances = AREAS.map(([id, name, lat, lng]) => ({ id, name, distance: haversine(item.coordinates.lat, item.coordinates.lng, lat as number, lng as number) })).sort((a, b) => a.distance - b.distance)
  const eligible = distances.filter((entry) => entry.distance <= 5).map((entry) => entry.name)
  if (!eligible.length) continue
  const id = `${item.source}-${item.sourceId}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 110)
  places[id] = { id, name: item.name, source: item.source, sourceId: item.sourceId, address: item.address, coordinates: item.coordinates, primaryArea: distances[0].name, eligibleAreas: eligible, activity: meta.activity, activityGroup: meta.group, genres: meta.genres, price: { band: meta.band, min: meta.min, max: meta.max, source: meta.band === 'UNKNOWN' ? 'UNKNOWN' : 'CATEGORY_ESTIMATE' }, typicalDurationMinutes: meta.duration, indoor: meta.indoor, outdoor: meta.outdoor, minimumAge: null, adultOrRestricted: ['Bar', 'Nightclub'].includes(meta.activity), quality: meta.quality, usable: !['MINOR_POI'].includes(meta.quality), sourceDataset: item.sourceDataset }
}

const areaFiles: Record<string, string[]> = {}
const report: any[] = []
const groupTargets: Record<string, number> = { Food: 190, Nightlife: 90, Active: 80, Outdoor: 70, Entertainment: 70 }
for (const [id, name, lat, lng] of AREAS) {
  const eligible = Object.values(places).filter((place: any) => place.eligibleAreas.includes(name) && place.usable)
  const sortForArea = (a: any, b: any) => {
    const aAddress = a.address?.formatted && a.address?.postcode ? 0 : a.address?.formatted ? 1 : 2
    const bAddress = b.address?.formatted && b.address?.postcode ? 0 : b.address?.formatted ? 1 : 2
    return aAddress - bAddress || haversine(a.coordinates.lat, a.coordinates.lng, lat as number, lng as number) - haversine(b.coordinates.lat, b.coordinates.lng, lat as number, lng as number)
  }
  const selected: any[] = []
  const seen = new Set<string>()
  for (const [group, target] of Object.entries(groupTargets)) {
    for (const place of eligible.filter((candidate: any) => candidate.activityGroup === group).sort(sortForArea).slice(0, target)) {
      if (!seen.has(place.id)) { selected.push(place); seen.add(place.id) }
    }
  }
  for (const place of eligible.sort(sortForArea)) {
    if (selected.length >= 500) break
    if (!seen.has(place.id)) { selected.push(place); seen.add(place.id) }
  }
  const ids = selected.slice(0, 500).map((place: any) => place.id)
  areaFiles[id] = ids
  const records = ids.map((placeId) => places[placeId])
  report.push({
    area: name,
    total: ids.length,
    food: records.filter((p: any) => p.activityGroup === 'Food').length,
    drinks: records.filter((p: any) => p.activityGroup === 'Nightlife').length,
    gamesEntertainment: records.filter((p: any) => p.activityGroup === 'Entertainment').length,
    active: records.filter((p: any) => p.activityGroup === 'Active').length,
    outdoor: records.filter((p: any) => p.activityGroup === 'Outdoor').length,
    withFullAddressAndPostcode: records.filter((p: any) => p.address?.formatted && p.address?.postcode).length,
  })
}

await mkdir('data/sidequest/areas', { recursive: true })
await writeFile('data/sidequest/places.json', JSON.stringify({ generatedAt: new Date().toISOString(), sources: SOURCES, places }, null, 2))
await writeFile('data/sidequest/areas.json', JSON.stringify(Object.fromEntries(AREAS.map(([id, name, lat, lng]) => [id, { id, name, slug: id, city: 'London', centreLatitude: lat, centreLongitude: lng, initialRadiusKm: 1.5, maximumRadiusKm: 5 }])), null, 2))
for (const [id, ids] of Object.entries(areaFiles)) await writeFile(`data/sidequest/areas/${id}.json`, JSON.stringify(ids, null, 2))
await writeFile('data/sidequest/catalogue-report.json', JSON.stringify(report, null, 2))
await writeFile('data/sidequest/SOURCES.md', `# SideQuest catalogue sources\n\n- Enriched Tourism Dataset London (POIs), CC BY 4.0\n- OpenStreetMap-derived static GeoJSON datasets from loclocloc\n\nGenerated by scripts/build-sidequest-catalogue.ts.\n`)
console.log(`[catalogue] wrote ${Object.keys(places).length} places across ${AREAS.length} areas`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
