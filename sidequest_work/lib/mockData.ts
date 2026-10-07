export type City = {
  id: string
  name: string
  active: boolean
}

export type LondonArea = {
  id: string
  name: string
  borough: string
  available: boolean
}

export type Activity = {
  id: string
  title: string
  category: string
  estimatedCost: number
  estimatedTime: number
  difficulty: number
  image: string
  description: string
  area?: string
}

export const LONDON_AREAS: LondonArea[] = [
  { id: 'victoria', name: 'Victoria', borough: 'Westminster', available: true },
  { id: 'shoreditch', name: 'Shoreditch', borough: 'Hackney', available: true },
  { id: 'south-bank', name: 'South Bank', borough: 'Southwark', available: true },
  { id: 'soho', name: 'Soho', borough: 'Westminster', available: true },
  { id: 'covent-garden', name: 'Covent Garden', borough: 'Westminster', available: true },
  { id: 'camden', name: 'Camden', borough: 'Camden', available: true },
  { id: 'brixton', name: 'Brixton', borough: 'Lambeth', available: true },
  { id: 'greenwich', name: 'Greenwich', borough: 'Greenwich', available: true },
  { id: 'greenwich-peninsula', name: 'Greenwich Peninsula', borough: 'Greenwich', available: true },
  { id: 'north-greenwich', name: 'North Greenwich', borough: 'Greenwich', available: true },
  { id: 'notting-hill', name: 'Notting Hill', borough: 'Kensington and Chelsea', available: true },
  { id: 'canary-wharf', name: 'Canary Wharf', borough: 'Tower Hamlets', available: true },
  { id: 'islington', name: 'Islington', borough: 'Islington', available: true },
  { id: 'hackney', name: 'Hackney', borough: 'Hackney', available: true },
]

export const AREA_ALIASES: Record<string, string[]> = {
  Victoria: ['Victoria', 'Westminster'],
  Shoreditch: ['Shoreditch', 'Hackney', 'Hoxton', 'Old Street'],
  'South Bank': ['South Bank', 'Borough', 'Waterloo', 'London Bridge'],
  Soho: ['Soho', 'Mayfair', 'Fitzrovia'],
  Camden: ['Camden', "King's Cross"],
}

export type Quest = {
  id: string
  title: string
  city: string
  location: string
  budget: number
  timeMinutes: number
  difficulty: number
  steps: QuestStep[]
  vibes: string[]
  intent?: string
  totalCost: number
  costLabel?: string
  start?: { name?: string; latitude?: number; longitude?: number; formattedAddress?: string; city?: string }
  transport?: string
}

export type QuestStep = {
  number: number
  title: string
  description: string
  duration: number
  cost: number | null
  icon?: string
  placeId?: string
  name?: string
  venueName?: string
  address?: string | null
  postcode?: string | null
  activity?: string
  activityGroup?: string
  intents?: string[]
  genres?: string[]
  tags?: string[]
  priceLabel?: string
  place?: { name?: string; latitude?: number; longitude?: number; formattedAddress?: string; category?: string; activity?: string; postcode?: string | null }
}

export const CITIES: City[] = [
  { id: '1', name: 'London', active: true },
  { id: '2', name: 'Manchester', active: false },
  { id: '3', name: 'Bristol', active: false },
  { id: '4', name: 'Edinburgh', active: false },
  { id: '5', name: 'Birmingham', active: false },
  { id: '6', name: 'Liverpool', active: false },
]

export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Street Food Tour',
    category: 'Social',
    estimatedCost: 15,
    estimatedTime: 120,
    difficulty: 5.2,
    image: 'Street food market with colorful vendor stalls and people eating',
    description: 'Discover hidden street food gems',
  },
  {
    id: '2',
    title: 'Urban Sketching',
    category: 'Creative',
    estimatedCost: 5,
    estimatedTime: 180,
    difficulty: 6.1,
    image: 'Artist sketching historic buildings in a city square',
    description: 'Draw and explore the city',
  },
  {
    id: '3',
    title: 'Park Picnic Challenge',
    category: 'Chill',
    estimatedCost: 10,
    estimatedTime: 90,
    difficulty: 3.2,
    image: 'Group of friends having a picnic in a sunny green park',
    description: 'Budget picnic adventure',
  },
  {
    id: '4',
    title: 'Late Night Karaoke',
    category: 'Chaotic',
    estimatedCost: 20,
    estimatedTime: 180,
    difficulty: 7.8,
    image: 'Friends laughing at a karaoke bar with microphones',
    description: 'Spontaneous singing spree',
  },
  {
    id: '5',
    title: 'Sunset Hike',
    category: 'Active',
    estimatedCost: 0,
    estimatedTime: 120,
    difficulty: 5.5,
    image: 'Group hiking on a trail with golden sunset in background',
    description: 'Free hilltop adventure',
  },
  {
    id: '6',
    title: 'Coffee Shop Hop',
    category: 'Social',
    estimatedCost: 15,
    estimatedTime: 120,
    difficulty: 3.0,
    image: 'Cozy cafe interior with friends chatting over coffee',
    description: 'Visit 3+ indie cafes',
  },
]

export const TRENDING_QUESTS: Activity[] = [
  {
    id: '101',
    title: '5 London Challenge',
    category: 'Social',
    estimatedCost: 5,
    estimatedTime: 120,
    difficulty: 6.5,
    image: 'Busy London street with iconic red buses and historic architecture',
    description: 'Complete challenges for exactly 5 pounds',
  },
  {
    id: '102',
    title: 'Sunset SideQuest',
    category: 'Romantic',
    estimatedCost: 0,
    estimatedTime: 90,
    difficulty: 2.1,
    image: 'Couple watching golden sunset from a city viewpoint',
    description: 'Find the best sunset spot nearby',
  },
  {
    id: '103',
    title: 'Date Night Under 20',
    category: 'Romantic',
    estimatedCost: 20,
    estimatedTime: 180,
    difficulty: 4.8,
    image: 'Romantic dinner setup with candles and wine in a restaurant',
    description: 'Full date with budget limit',
  },
  {
    id: '104',
    title: 'Late Night Chaos',
    category: 'Chaotic',
    estimatedCost: 25,
    estimatedTime: 240,
    difficulty: 8.2,
    image: 'Friends having fun at night with neon lights and music',
    description: 'Unpredictable late-night mission',
  },
  {
    id: '105',
    title: 'Free Weekend Mission',
    category: 'Active',
    estimatedCost: 0,
    estimatedTime: 240,
    difficulty: 5.9,
    image: 'Group doing outdoor activities and exploring nature trails',
    description: 'No budget, maximum fun',
  },
]

export const VIBE_CATEGORIES = [
  { id: 'chill', label: 'Chill', icon: '😌' },
  { id: 'active', label: 'Active', icon: '🏃' },
  { id: 'social', label: 'Social', icon: '👯' },
  { id: 'chaotic', label: 'Chaotic', icon: '😈' },
  { id: 'romantic', label: 'Romantic', icon: '❤️' },
  { id: 'competitive', label: 'Competitive', icon: '🧠' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'random', label: 'Random', icon: '🎲' },
]


export const INTENT_CATEGORIES = [
  { id: 'SURPRISE', label: 'Surprise me', icon: '⚡', description: 'Mix it up' },
  { id: 'EAT', label: 'Want to eat', icon: '🍜', description: 'Restaurants, cafés & food' },
  { id: 'DRINKS', label: 'Drinks / bars', icon: '🍹', description: 'Bars, pubs & social spots' },
  { id: 'GAMES', label: 'Games & arcades', icon: '🕹️', description: 'Arcades, bowling & challenges' },
  { id: 'SHOPPING', label: 'Shopping', icon: '🛍️', description: 'Malls, markets & shops' },
  { id: 'ACTIVE', label: 'Sport & active', icon: '🏃', description: 'Move, compete & explore' },
  { id: 'CULTURE', label: 'Culture', icon: '🏛️', description: 'Museums, galleries & more' },
  { id: 'CINEMA', label: 'Cinema / shows', icon: '🎬', description: 'Films, theatre & entertainment' },
  { id: 'NIGHTLIFE', label: 'Nightlife', icon: '🌙', description: 'Late-night social plans' },
  { id: 'OUTDOORS', label: 'Outdoors / scenic', icon: '🌿', description: 'Parks, views & walks' },
]

export const BUDGET_OPTIONS = [
  { id: '0', label: '£0', value: 0 },
  { id: '5', label: '£5', value: 5 },
  { id: '10', label: '£10', value: 10 },
  { id: '20', label: '£20', value: 20 },
  { id: '50', label: '£50+', value: 50 },
]

export const TIME_OPTIONS = [
  { id: '30', label: '30 min', value: 30 },
  { id: '60', label: '1 hour', value: 60 },
  { id: '120', label: '2 hours', value: 120 },
  { id: '240', label: 'Half a day', value: 240 },
  { id: '480', label: 'All day', value: 480 },
]

export const PEOPLE_OPTIONS = [
  { id: '1', label: 'Just me', value: 1 },
  { id: '2', label: '2 people', value: 2 },
  { id: '3', label: '3-4 people', value: 3 },
  { id: '5', label: '5+ people', value: 5 },
]

export type PlaceRecord = {
  id: string
  name: string
  area: string
  kind: string
  tags: string[]
  costFrom: number
  duration: number
  sourceUrl: string
  verified: boolean
}

// Curated development records. A future placesProvider will replace this array with provider IDs, photos and live opening data.
export const GREENWICH_PLACES: PlaceRecord[] = [
  { id: 'north-greenwich-station', name: 'North Greenwich Underground Station', area: 'Greenwich Peninsula', kind: 'Transport', tags: ['tube', 'start'], costFrom: 0, duration: 10, sourceUrl: 'https://tfl.gov.uk/tube/route/jubilee/', verified: false },
  { id: 'toca-social', name: 'TOCA Social', area: 'Greenwich Peninsula', kind: 'Interactive football', tags: ['social', 'competitive', 'active', 'group', 'indoor'], costFrom: 15, duration: 75, sourceUrl: 'https://www.theo2.co.uk/do-more-at-the-o2', verified: false },
  { id: 'hollywood-bowl-o2', name: 'Hollywood Bowl at The O2', area: 'Greenwich Peninsula', kind: 'Bowling', tags: ['social', 'competitive', 'bowling', 'group', 'indoor'], costFrom: 10, duration: 75, sourceUrl: 'https://www.theo2.co.uk/do-more-at-the-o2', verified: false },
  { id: 'greenwich-market', name: 'Greenwich Market', area: 'Greenwich Town', kind: 'Market', tags: ['foodie', 'social', 'creative', 'market'], costFrom: 5, duration: 45, sourceUrl: 'https://www.greenwichmarket.london/', verified: false },
  { id: 'greenwich-park', name: 'Greenwich Park', area: 'Greenwich Town', kind: 'Park and viewpoint', tags: ['chill', 'active', 'romantic', 'outdoor', 'walking'], costFrom: 0, duration: 60, sourceUrl: 'https://www.royalparks.org.uk/visit/parks/greenwich-park', verified: false },
  { id: 'royal-observatory', name: 'Royal Observatory Greenwich', area: 'Greenwich Town', kind: 'Museum and viewpoint', tags: ['creative', 'romantic', 'history', 'experience'], costFrom: 24, duration: 90, sourceUrl: 'https://www.rmg.co.uk/royal-observatory', verified: false },
  { id: 'cutty-sark', name: 'Cutty Sark', area: 'Greenwich Town', kind: 'Historic ship', tags: ['creative', 'history', 'experience'], costFrom: 20, duration: 75, sourceUrl: 'https://www.rmg.co.uk/cutty-sark', verified: false },
  { id: 'painted-hall', name: 'Painted Hall at the Old Royal Naval College', area: 'Greenwich Town', kind: 'Historic interior', tags: ['creative', 'history', 'indoor'], costFrom: 17, duration: 60, sourceUrl: 'https://ornc.org/see-do/painted-hall/', verified: false },
  { id: 'greenwich-pier', name: 'Greenwich Pier', area: 'Greenwich Town', kind: 'Riverside', tags: ['chill', 'romantic', 'river', 'walking'], costFrom: 0, duration: 30, sourceUrl: 'https://www.thamesclippers.com/plan-your-journey/piers/greenwich-pier', verified: false },
  { id: 'north-greenwich-pier', name: 'North Greenwich Pier', area: 'Greenwich Peninsula', kind: 'River transport', tags: ['river', 'scenic', 'transport'], costFrom: 0, duration: 20, sourceUrl: 'https://www.thamesclippers.com/plan-your-journey/piers/north-greenwich-pier', verified: false },
]

function chooseGreenwichPlaces(area: string, budget: number, vibes: string[]) {
  const areaPlaces = GREENWICH_PLACES.filter((place) => place.area.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes('london'))
  const matches = areaPlaces.filter((place) => place.costFrom <= budget && (vibes.length === 0 || place.tags.some((tag) => vibes.some((vibe) => tag.toLowerCase() === vibe.toLowerCase()))))
  return (matches.length >= 3 ? matches : areaPlaces).slice(0, 5)
}

export function generateMockQuest(area: string, budget: number, time: number, people: number, vibes: string[]): Quest {
  const places = chooseGreenwichPlaces(area, budget, vibes)
  const start = places.find((place) => place.tags.includes('start')) ?? (area.toLowerCase().includes('peninsula') ? GREENWICH_PLACES[0] : GREENWICH_PLACES.find((place) => place.id === 'greenwich-pier')!)
  const stops = places.filter((place) => place.id !== start.id).slice(0, time <= 60 ? 2 : 4)
  const routeText = area.toLowerCase().includes('peninsula')
    ? `Start at ${start.name} on the Jubilee line, then walk to ${stops[0]?.name ?? 'The O2 complex'}.`
    : `Meet at ${start.name}, then follow the Thames Path to ${stops[0]?.name ?? 'Greenwich Park'}.`
  const selected = [start, ...stops]
  const steps: QuestStep[] = selected.map((place, index) => ({ number: index + 1, title: index === 0 ? 'START HERE' : index === selected.length - 1 ? 'FINISH' : `STOP ${index}`, description: index === 0 ? routeText : `Visit ${place.name} in ${place.area}. ${place.kind} — check current opening times and pricing before setting off.`, duration: place.duration, cost: Math.min(budget, place.costFrom), icon: place.kind }))
  const totalCost = Math.min(budget, steps.reduce((sum, step) => sum + (step.cost ?? 0), 0))
  return { id: Math.random().toString(36).slice(2, 11), title: budget <= 10 ? 'The Greenwich Low-Budget Loop' : 'The Greenwich Real-Place Challenge', city: 'London', location: area, budget, timeMinutes: time, difficulty: Number((5.5 + Math.min(2, people / 3) + (vibes.includes('Chaotic') ? 1 : 0)).toFixed(1)), steps, vibes, totalCost }
}

export const COMPLETED_QUEST_EXAMPLE: Quest & { spent: number; spentTime: number; questNumber: number } = {
  id: 'completed-1',
  questNumber: 184,
  title: 'The City Challenge',
  city: 'London',
  location: 'Central London',
  budget: 10,
  timeMinutes: 120,
  difficulty: 8.2,
  steps: [
    {
      number: 1,
      title: 'START HERE',
      description: 'Gather at Leicester Square',
      duration: 15,
      cost: 0,
    },
    {
      number: 2,
      title: 'THE CHALLENGE',
      description: 'Find a public piano and play a song',
      duration: 50,
      cost: 0,
    },
    {
      number: 3,
      title: 'FOOD STOP',
      description: 'Grab the cheapest interesting food you can find',
      duration: 30,
      cost: 6,
    },
    {
      number: 4,
      title: 'FINAL CHALLENGE',
      description: 'Take a ridiculous photo with a statue',
      duration: 15,
      cost: 2.6,
    },
    {
      number: 5,
      title: 'FINISH',
      description: 'Complete and rate your experience',
      duration: 0,
      cost: 0,
    },
  ],
  vibes: ['Social', 'Creative'],
  totalCost: 8.6,
  spent: 8.6,
  spentTime: 114,
}
