import { NextResponse } from 'next/server'
import { geoapifyPlacesProvider } from '@/lib/places/geoapify'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: string; latitude?: number; longitude?: number; radiusMeters?: number; includedTypes?: string[] }
    const query = body.query?.trim()
    if (!query || query.length > 160) return NextResponse.json({ error: 'A search query is required.' }, { status: 400 })
    const places = await geoapifyPlacesProvider.searchText({ query, latitude: body.latitude, longitude: body.longitude, radiusMeters: body.radiusMeters, includedTypes: body.includedTypes })
    return NextResponse.json({ places })
  } catch (error) {
    console.error('[v0] place search failed', error)
    return NextResponse.json({ error: 'Place search is not configured yet.' }, { status: 503 })
  }
}
