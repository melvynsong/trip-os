import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type GoogleAddressComponent = {
  long_name?: string
  short_name?: string
  types?: string[]
}

type GooglePlaceDetailsResponse = {
  status?: string
  error_message?: string
  result?: {
    name?: string
    place_id?: string
    formatted_address?: string
    geometry?: {
      location?: {
        lat?: number
        lng?: number
      }
    }
    address_components?: GoogleAddressComponent[]
  }
}

export const runtime = 'nodejs'

function extractAddressParts(addressComponents: GoogleAddressComponent[] | undefined) {
  const components = addressComponents || []

  const city =
    components.find((component) => component.types?.includes('locality'))?.long_name ||
    components.find((component) => component.types?.includes('postal_town'))?.long_name ||
    null

  const country =
    components.find((component) => component.types?.includes('country'))?.long_name || null

  return { city, country }
}

export async function GET(request: Request) {
  try {
    if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_MAPS_SERVER_API_KEY is not configured.' },
        { status: 500 }
      )
    }

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

    const params = new URLSearchParams({
      place_id: placeId,
      key: process.env.GOOGLE_MAPS_SERVER_API_KEY,
      fields: 'name,place_id,formatted_address,geometry,address_component',
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      {
        cache: 'no-store',
      }
    )

    const payload = (await response.json()) as GooglePlaceDetailsResponse

    if (!response.ok || payload.status !== 'OK' || !payload.result) {
      return NextResponse.json(
        {
          error:
            payload.error_message ||
            (payload.status ? `Google Places error: ${payload.status}` : 'Failed to fetch place details.'),
        },
        { status: 502 }
      )
    }

    const details = payload.result
    const location = details.geometry?.location

    if (
      !details.name ||
      !details.place_id ||
      !details.formatted_address ||
      typeof location?.lat !== 'number' ||
      typeof location?.lng !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Incomplete place details returned by Google Places.' },
        { status: 502 }
      )
    }

    const { city, country } = extractAddressParts(details.address_components)

    return NextResponse.json({
      place: {
        name: details.name,
        address: details.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        external_place_id: details.place_id,
        city,
        country,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected error fetching place details.',
      },
      { status: 500 }
    )
  }
}
