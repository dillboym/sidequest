import SideQuestApp from '@/components/sidequest-app'
import { getFeaturedPlaces } from '@/lib/sidequest/featured'

export default function Page() {
  return <SideQuestApp featuredPlaces={getFeaturedPlaces()} />
}

export const metadata = {
  title: 'SideQuest — Find Something Worth Doing',
  description: 'Tell SideQuest your location, budget, time and vibe. Get a personalised adventure.',
}

export const dynamic = 'force-static'

// Prototype routes are kept as small entry points so the UI can later be backed by real data services.
export const viewport = { themeColor: '#111b24' }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = '/'

