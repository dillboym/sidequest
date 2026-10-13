import SideQuestApp from '@/components/sidequest-app'
import { getFeaturedPlaces } from '@/lib/sidequest/featured'

export default function ExplorePage() {
  return <SideQuestApp page="explore" featuredPlaces={getFeaturedPlaces()} />
}
