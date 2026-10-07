import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

type Place = { id: string; name: string; source: string; sourceId: string; address: unknown; coordinates: unknown; primaryArea: string; eligibleAreas: string[]; activity: string; activityGroup: string; genres: string[]; price: unknown; typicalDurationMinutes: number; indoor: boolean | null; outdoor: boolean | null; minimumAge: number | null; adultOrRestricted: boolean; quality: string; usable: boolean; sourceDataset: string }

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  const supabase = createClient(url, key)
  const file = JSON.parse(await readFile('data/sidequest/places.json', 'utf8')) as { places: Record<string, Place> }
  const places = Object.values(file.places)
  for (let index = 0; index < places.length; index += 500) {
    const batch = places.slice(index, index + 500)
    const { error } = await supabase.from('catalogue_places').upsert(batch, { onConflict: 'id' })
    if (error) throw error
    console.log(`[catalogue] upserted ${Math.min(index + 500, places.length)}/${places.length}`)
  }
  console.log(`[catalogue] upsert complete: ${places.length} places`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
