import { NextResponse } from 'next/server'
import { PREMIUM_FIND_PLACE_TIERS, hasAccess } from '@/lib/membership/access'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { createClient } from '@/lib/supabase/server'
import { toLegacyCategory, type PlaceSource, type PlaceType } from '@/lib/places'

export const runtime = 'nodejs'

const VALID_PLACE_TYPES: PlaceType[] = [
  'attraction',
  'restaurant',
  'shopping',
  'cafe',
  'hotel',
  'other',
]

const VALID_SOURCES: PlaceSource[] = ['openstreetmap', 'google', 'manual']
const SOURCES_REQUIRING_EXTERNAL_ID: PlaceSource[] = ['openstreetmap', 'google']

type SavePlacePayload = {
  name?: string
  place_type?: PlaceType
  address?: string | null
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  external_place_id?: string | null
  source?: PlaceSource
  notes?: string | null
  visited?: boolean
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json()) as SavePlacePayload

    const name = String(body.name || '').trim()
    const placeType = String(body.place_type || '').trim() as PlaceType
    const source = String(body.source || '').trim() as PlaceSource

    if (!name) {
      return NextResponse.json({ error: 'Place name is required.' }, { status: 400 })
    }

    if (!VALID_PLACE_TYPES.includes(placeType)) {
      return NextResponse.json({ error: 'Invalid place_type.' }, { status: 400 })
    }

    if (!VALID_SOURCES.includes(source)) {
      return NextResponse.json({ error: 'Invalid source.' }, { status: 400 })
    }

    const address = String(body.address || '').trim() || null
    const city = String(body.city || '').trim() || null
    const country = String(body.country || '').trim() || null
    const notes = String(body.notes || '').trim() || null

    const latitude = typeof body.latitude === 'number' ? body.latitude : null
    const longitude = typeof body.longitude === 'number' ? body.longitude : null

    const externalPlaceId = String(body.external_place_id || '').trim() || null

    if (source === 'google') {
      const membership = await getCurrentUserMembership()

      if (!hasAccess(membership.tier, PREMIUM_FIND_PLACE_TIERS)) {
        return NextResponse.json({ error: 'Premium access required.' }, { status: 403 })
      }
    }

    if (SOURCES_REQUIRING_EXTERNAL_ID.includes(source) && !externalPlaceId) {
      return NextResponse.json(
        {
          error: 'external_place_id is required when source is provider-backed.',
        },
        { status: 400 }
      )
    }

    if (SOURCES_REQUIRING_EXTERNAL_ID.includes(source) && (latitude === null || longitude === null)) {
      return NextResponse.json(
        {
          error: 'Latitude and longitude are required when source is provider-backed.',
        },
        { status: 400 }
      )
    }

    if (externalPlaceId) {
      const { data: existing } = await supabase
        .from('places')
        .select('*')
        .eq('trip_id', tripId)
        .eq('external_place_id', externalPlaceId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ place: existing, existing: true }, { status: 200 })
      }
    }

    const legacyCategory = toLegacyCategory(placeType)

    const { data: inserted, error: insertError } = await supabase
      .from('places')
      .insert({
        trip_id: tripId,
        name,
        place_type: placeType,
        category: legacyCategory,
        address,
        city,
        country,
        latitude,
        longitude,
        external_place_id: externalPlaceId,
        source,
        notes,
        visited: body.visited === true,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to save place.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ place: inserted }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error saving place.',
      },
      { status: 500 }
    )
  }
}
