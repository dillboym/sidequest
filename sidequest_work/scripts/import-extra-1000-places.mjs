import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = fileURLToPath(new URL('../data/sidequest/', import.meta.url))
const read = async (name) => JSON.parse(await readFile(root + name, 'utf8'))
const save = async (name, value) => { await writeFile(root + name + '.tmp', JSON.stringify(value, null, 2) + '\n'); await rename(root + name + '.tmp', root + name) }
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const normalizeName = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const distance = (a, b) => {
  const r = Math.PI / 180
  const q = Math.sin((b.lat-a.lat)*r/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2
  return 6371000 * 2 * Math.asin(Math.sqrt(q))
}
// Category identifiers verified against https://apidocs.geoapify.com/docs/places/.
const searches = [
  ['entertainment.amusement_arcade','Arcade','Entertainment','GAMES',5,20,60],
  ['entertainment.bowling_alley','Bowling','Entertainment','GAMES',12,30,75],
  ['entertainment.escape_game','Escape Room','Entertainment','GAMES',20,40,75],
  ['entertainment.miniature_golf','Mini Golf','Entertainment','GAMES',10,25,60],
  ['entertainment.activity_park.climbing','Climbing','Active','ACTIVE',12,25,90],
  ['entertainment.activity_park.trampoline','Trampoline Park','Active','ACTIVE',12,25,90],
  ['sport.sports_centre','Sports','Active','ACTIVE',10,25,90],
  ['sport.ice_rink','Ice Skating','Active','ACTIVE',10,25,90],
  ['sport.swimming_pool','Swimming','Active','ACTIVE',5,15,60],
  ['entertainment.cinema','Cinema','Entertainment','CINEMA',10,20,150],
  ['entertainment.culture.theatre','Theatre','Culture','CINEMA',25,60,150],
  ['entertainment.museum','Museum','Culture','CULTURE',null,null,90],
  ['entertainment.culture.gallery','Gallery','Culture','CULTURE',null,null,60],
  ['entertainment.culture.arts_centre','Arts Centre','Culture','CULTURE',null,null,75],
  ['commercial.shopping_mall','Shopping Centre','Shopping','SHOPPING',0,null,90],
  ['commercial.department_store','Department Store','Shopping','SHOPPING',0,null,60],
  ['commercial.marketplace','Market','Shopping','SHOPPING',0,null,60],
  ['commercial.books','Bookshop','Shopping','SHOPPING',0,null,40],
  ['commercial.video_and_music','Record Shop','Shopping','SHOPPING',0,null,40],
  ['commercial.toy_and_game','Games Shop','Shopping','SHOPPING',0,null,40],
  ['commercial.clothing','Clothing Shop','Shopping','SHOPPING',0,null,45],
  ['catering.bar','Bar','Nightlife','DRINKS',10,30,75],
  ['catering.pub','Pub','Nightlife','DRINKS',10,30,75],
  ['catering.biergarten','Beer Garden','Nightlife','DRINKS',10,30,75],
  ['catering.food_court','Food Hall','Food','EAT',10,25,60],
  ['catering.ice_cream','Dessert','Food','EAT',4,15,30],
  ['catering.cafe','Cafe','Food','EAT',4,15,40],
  ['catering.fast_food','Fast Food','Food','EAT',5,15,30],
  ['catering.restaurant','Restaurant','Food','EAT',15,30,75],
]
const tags = {
  GAMES: ['Competitive','Social','Group','Indoor','Rainy-day'],
  ACTIVE: ['Active','Adventure','Competitive','Group'],
  CINEMA: ['Chill','Date','Indoor','Rainy-day'],
  CULTURE: ['Creative','Chill','Solo','Date','Indoor'],
  SHOPPING: ['Social','Chill','Solo'],
  DRINKS: ['Social','Nightlife','Date','Group'],
  EAT: ['Foodie','Social','Date','Indoor'],
}

async function main() {
  const catalogue = await read('places.json')
  const areas = Object.values(await read('areas.json'))
  const places = catalogue.places
  const originalCount = Object.keys(places).length
  const key = process.env.GEOAPIFY_API_KEY?.trim()
  let cache
  try { cache = await read('import-cache.json') } catch { cache = { queries: {}, reverse: {} } }
  let added = 0, rejected = 0, duplicates = 0, requests = 0, failure = null
  const seen = new Set(Object.values(places).map(p => p.providerPlaceId ?? (p.source === 'geoapify' ? p.sourceId : null)).filter(Boolean))
  const processed = new Set()
  const byName = new Map()
  for (const p of Object.values(places)) { const n = normalizeName(p.name); byName.set(n, [...(byName.get(n) ?? []), p]) }
  const api = async (path, params) => {
    if (!key) throw new Error('GEOAPIFY_API_KEY is not available to the import process. No venues have been fabricated.')
    if (++requests > 2400) throw new Error('Import request cap reached; rerun to resume from cache.')
    await new Promise(resolve => setTimeout(resolve, 250))
    const url = new URL(path, 'https://api.geoapify.com')
    url.search = new URLSearchParams({ ...params, apiKey: key })
    let response
    try { response = await fetch(url, { signal: AbortSignal.timeout(15000) }) } catch { throw new Error('Geoapify request timed out or could not connect; rerun to resume.') }
    if (!response.ok) throw new Error(`Geoapify returned HTTP ${response.status}; import paused without discarding existing records.`)
    return response.json()
  }
  try {
    if (!key && !process.argv.includes('--report-only')) throw new Error('GEOAPIFY_API_KEY is not available to the import process.')
    if (!process.argv.includes('--report-only')) {
      for (const radius of [1500,2500,3500,5000]) {
        for (const area of areas) {
          for (const spec of searches) {
            const [category,activity,group,intent,min,max,duration] = spec
            // All areas receive every targeted category before expanding the radius.
            const queryId = `${area.slug}:${category}:${radius}`
            if (!cache.queries[queryId]) {
              const response = await api('/v2/places', { categories: category, filter: `circle:${area.centreLongitude},${area.centreLatitude},${radius}`, bias: `proximity:${area.centreLongitude},${area.centreLatitude}`, limit: '100' })
              cache.queries[queryId] = (response.features ?? []).map(f => f.properties)
              await save('import-cache.json', cache)
            }
            for (const p of cache.queries[queryId]) {
              if (!p.place_id || processed.has(p.place_id)) continue
              processed.add(p.place_id)
              const coordinates = { lat: p.lat, lng: p.lon }
              if (!clean(p.name) || /^(unnamed|unknown|parking|toilets?|bench|bus stop)$/i.test(clean(p.name)) || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) { rejected++; continue }
              if (seen.has(p.place_id) || (byName.get(normalizeName(p.name)) ?? []).some(old => distance(old.coordinates, coordinates) < 80)) { duplicates++; continue }
              const eligible = areas.map(a => ({ area: a, meters: distance(coordinates, { lat: a.centreLatitude, lng: a.centreLongitude }) })).filter(a => a.meters <= Math.min(5000,a.area.maximumRadiusKm*1000)).sort((a,b) => a.meters-b.meters)
              if (!eligible.length || p.country_code && p.country_code !== 'gb') { rejected++; continue }
              let address = p
              if (!p.postcode || !p.street) {
                if (!(p.place_id in cache.reverse)) {
                  const response = await api('/v1/geocode/reverse', { lat: String(p.lat), lon: String(p.lon), limit: '1' })
                  const reverse = response.features?.[0]?.properties
                  // Reverse geocoding identifies a nearby address, not necessarily this business.
                  cache.reverse[p.place_id] = reverse && distance(coordinates, { lat: reverse.lat, lng: reverse.lon }) <= 40 && (!p.street || p.street === reverse.street) ? reverse : null
                  await save('import-cache.json', cache)
                }
                const enrichment = cache.reverse[p.place_id]
                if (enrichment) address = { ...enrichment, ...Object.fromEntries(Object.entries(p).filter(([,v]) => v != null && v !== '')) }
              }
              const postcode = clean(address.postcode).toUpperCase()
              if (!address.street || !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(postcode)) { rejected++; continue }
              const street = clean([address.housenumber,address.street].filter(Boolean).join(' '))
              const id = 'geoapify-' + createHash('sha256').update(p.place_id).digest('hex').slice(0,24)
              const restricted = intent === 'DRINKS'
              const record = { id, provider: 'geoapify', providerPlaceId: p.place_id, source: 'geoapify', sourceId: p.place_id, name: clean(p.name), address: { formatted: `${street}, London, ${postcode}`, street, postcode, city: 'London' }, addressSource: address === p ? 'GEOAPIFY_PLACES' : 'GEOAPIFY_REVERSE_NEARBY', coordinates, primaryArea: eligible[0].area.name, eligibleAreas: eligible.map(a => a.area.name), activity, activityGroup: group, intents: [intent,...(intent === 'DRINKS' ? ['NIGHTLIFE'] : intent === 'GAMES' ? ['GENERAL_ENTERTAINMENT'] : [])], genres: tags[intent], providerCategories: p.categories ?? [category], price: { band: group === 'Shopping' ? 'SPEND_OPTIONAL' : min == null ? 'UNKNOWN' : min >= 20 ? '£££' : min >= 10 ? '££' : '£', min, max, source: min == null ? 'UNKNOWN' : 'CATEGORY_ESTIMATE' }, typicalDurationMinutes: duration, indoor: ['ACTIVE','SHOPPING'].includes(intent) ? null : activity !== 'Beer Garden', outdoor: activity === 'Beer Garden' ? true : null, adultRestricted: restricted, adultOrRestricted: restricted, minimumAge: restricted ? 18 : null, quality: 'PRIMARY_DESTINATION', usable: true, sourceDataset: 'Geoapify Places / OpenStreetMap', importedAt: new Date().toISOString() }
              places[id] = record; seen.add(p.place_id); byName.set(normalizeName(p.name), [...(byName.get(normalizeName(p.name)) ?? []),record]); added++
            }
          }
          await save('places.json', catalogue)
          console.log(`${area.name}: ${added} new unique venues so far`)
        }
        if (added >= 1000) break
      }
    }
  } catch (error) { failure = error.message }
  await mkdir(root + 'areas', { recursive: true })
  const areaReports = []
  for (const area of areas) {
    const eligible = Object.values(places).filter(p => p.usable && p.eligibleAreas.includes(area.name))
    const rank = (a,b) => Number(Boolean(b.address?.postcode && b.address?.street))-Number(Boolean(a.address?.postcode && a.address?.street)) || distance(a.coordinates,{lat:area.centreLatitude,lng:area.centreLongitude})-distance(b.coordinates,{lat:area.centreLatitude,lng:area.centreLongitude})
    const selected = new Map()
    for (const group of ['Entertainment','Active','Culture','Shopping','Nightlife','Food','Outdoor']) {
      for (const p of eligible.filter(p => p.activityGroup === group).sort(rank).slice(0,group === 'Food' ? 200 : group === 'Outdoor' ? 40 : 85)) selected.set(p.id,p)
    }
    for (const p of eligible.sort(rank)) { if (selected.size >= 700) break; selected.set(p.id,p) }
    // Report-only and a blocked import leave the existing area pools untouched.
    const ids = added ? [...selected.keys()].slice(0,700) : await read(`areas/${area.slug}.json`)
    if (added) await save(`areas/${area.slug}.json`,ids)
    const rows = ids.map(id => places[id]).filter(Boolean)
    const count = (re) => rows.filter(p => re.test(`${p.activity} ${p.activityGroup}`.toLowerCase())).length
    areaReports.push({ area:area.name,total:rows.length,food:count(/food|restaurant|cafe|dessert/),drinks:count(/bar|pub/),games:count(/arcade|bowling|mini golf|escape|gaming/),shopping:count(/shopping|bookshop|record shop|market/),active:count(/active|sport|climb/),culture:count(/culture|museum|gallery/),cinema:count(/cinema|theatre/),nightlife:count(/nightlife|music/),outdoor:count(/outdoor|scenic|park|garden/),withAddress:rows.filter(p=>p.address?.formatted).length,withPostcode:rows.filter(p=>p.address?.postcode).length })
  }
  if (added) await save('places.json',catalogue)
  const report = { generatedAt:new Date().toISOString(),status:failure ? 'BLOCKED' : added >= 1000 ? 'COMPLETE' : 'BELOW_TARGET',originalPlaceCount:originalCount,newPlaceCount:added,finalUniquePlaceCount:Object.keys(places).length,activeLondonAreas:areas.length,duplicatesRemoved:duplicates,invalidRecordsRejected:rejected,requests,failure,areas:areaReports }
  await save('catalogue-report.json',report)
  console.log(JSON.stringify(report,null,2))
  if (failure || added < 1000 && !process.argv.includes('--report-only')) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode=1 })
