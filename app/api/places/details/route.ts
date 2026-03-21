import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractCity, parseExternalPlaceId, toOsmLookupId, type OsmLookupResult } from '@/app/api/places/shared'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const placeId = String(searchParams.get('placeId') || '').trim()

    if (!placeId) {
      return NextResponse.json({ error: 'placeId is required.' }, { status: 400 })
    }

    const parsed = parseExternalPlaceId(placeId)

    if (!parsed) {
      return NextResponse.json({ error: 'Invalid placeId format.' }, { status: 400 })
    }

    const osmLookupId = toOsmLookupId(parsed.osmType, parsed.osmId)

    if (!osmLookupId) {
      return NextResponse.json({ error: 'Unsupported OSM type.' }, { status: 400 })
    }

    const params = new URLSearchParams({
      osm_ids: osmLookupId,
      format: 'jsonv2',
      addressdetails: '1',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/lookup?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Trip.OS/1.0 (place details)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch place details.' }, { status: 502 })
    }

    const payload = (await response.json()) as OsmLookupResult[]
    const details = payload[0]

    const latitude = details?.lat ? Number(details.lat) : null
    const longitude = details?.lon ? Number(details.lon) : null

    if (!details?.display_name || latitude === null || longitude === null) {
      return NextResponse.json({ error: 'Incomplete place details returned by provider.' }, { status: 502 })
    }

    const address = details.display_name
    const name = address.split(',')[0]?.trim() || address

    return NextResponse.json({
      place: {
        name,
        address,
        latitude,
        longitude,
        external_place_id: placeId,
        city: extractCity(details.address),
        country: details.address?.country || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error fetching place details.',
      },
      { status: 500 }
    )
  }
}
