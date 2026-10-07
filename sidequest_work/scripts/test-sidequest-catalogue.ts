import { readFileSync, readdirSync } from 'node:fs'

const root = 'data/sidequest'
const places = JSON.parse(readFileSync(`${root}/places.json`, 'utf8')).places as Record<string, unknown>
const files = readdirSync(`${root}/areas`).filter((file) => file.endsWith('.json'))
let total = 0
let valid = 0
const broken: string[] = []
for (const file of files) {
  const ids = JSON.parse(readFileSync(`${root}/areas/${file}`, 'utf8')) as string[]
  for (const id of ids) {
    total += 1
    if (places[id]) valid += 1
    else broken.push(`${file}:${id}`)
  }
}
console.log(JSON.stringify({ totalAreaReferences: total, validReferences: valid, brokenReferences: broken.length, broken }, null, 2))
if (broken.length) process.exit(1)
