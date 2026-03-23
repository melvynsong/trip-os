import { NextResponse } from 'next/server'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { PREMIUM_FIND_PLACE_TIERS, hasAccess } from '@/lib/membership/access'
import { enforceGooglePlacesRateLimit, getGooglePlaceDetails } from '@/lib/google-places'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const membership = await getCurrentUserMembership()

    if (!hasAccess(membership.tier, PREMIUM_FIND_PLACE_TIERS)) {
      return NextResponse.json({ error: 'Premium access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const placeId = String(searchParams.get('placeId') || '').trim()
    const sessionToken = String(searchParams.get('sessionToken') || '').trim() || undefined

    if (!placeId) {
      return NextResponse.json({ error: 'placeId is required.' }, { status: 400 })
    }

    enforceGooglePlacesRateLimit(membership.userId, 'details')

    const place = await getGooglePlaceDetails(placeId, sessionToken)

    return NextResponse.json({ place })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching Google place details.'
    const status = /rate limit/i.test(message) ? 429 : /Unauthorized|Premium access required/i.test(message) ? 403 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
