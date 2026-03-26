import { NextResponse } from 'next/server'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { PREMIUM_FIND_PLACE_TIERS, hasAccess } from '@/lib/membership/access'
import { searchGooglePlaces, enforceGooglePlacesRateLimit } from '@/lib/google-places'
import { type PlaceType } from '@/lib/places'

export const runtime = 'nodejs'

const VALID_PLACE_TYPES: PlaceType[] = [
  'attraction',
  'restaurant',
  'shopping',
  'cafe',
  'hotel',
  'other',
]

export async function GET(request: Request) {
  try {
    const membership = await getCurrentUserMembership()

    if (!hasAccess(membership.tier, PREMIUM_FIND_PLACE_TIERS)) {
      return NextResponse.json({ error: 'Premium access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = String(searchParams.get('q') || '').trim()
    const destination = String(searchParams.get('destination') || '').trim()
    const sessionToken = String(searchParams.get('sessionToken') || '').trim() || undefined
    const modeRaw = String(searchParams.get('mode') || 'search').trim().toLowerCase()
    const mode = modeRaw === 'starter' ? 'starter' : 'search'
    const placeTypeRaw = String(searchParams.get('placeType') || 'other').trim().toLowerCase()
    const placeType = VALID_PLACE_TYPES.includes(placeTypeRaw as PlaceType)
      ? (placeTypeRaw as PlaceType)
      : 'other'

    if (query.length < 3) {
      return NextResponse.json({ results: [] })
    }

    enforceGooglePlacesRateLimit(membership.userId, 'search')

    const results = await searchGooglePlaces({
      query,
      destination,
      placeType,
      sessionToken,
      mode,
    })

    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching Google places.'
    const status = /rate limit/i.test(message) ? 429 : /Unauthorized|Premium access required/i.test(message) ? 403 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
