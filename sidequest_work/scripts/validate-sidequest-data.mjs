import { readFileSync, readdirSync } from 'node:fs'
const root = new URL('../data/sidequest/', import.meta.url)
const catalogue = JSON.parse(readFileSync(new URL('places.json', root), 'utf8')).places
const files = readdirSync(new URL('areas/', root)).filter((file) => file.endsWith('.json'))
let failures = 0
for (const file of files) {
  const ids = JSON.parse(readFileSync(new URL(`areas/${file}`, root), 'utf8'))
  const rows = ids.map((id) => catalogue[id]).filter(Boolean)
  const fullAddress = rows.filter((p) => p?.address?.formatted && p?.address?.postcode).length
  const missing = ids.length - rows.length
  console.log(`${file.replace('.json','')}: ${rows.length} places, ${fullAddress} with address+postcode, ${missing} broken refs`)
  if (rows.length < 500 || missing) failures++
}
if (failures) process.exitCode = 1
