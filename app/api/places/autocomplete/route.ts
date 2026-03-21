import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapPlaceTypeToGoogleType, type PlaceType } from '@/lib/places'

export const runtime = 'nodejs'

const VALID_PLACE_TYPES: PlaceType[] = [
  'attraction',
  'restaurant',
  'shopping',
  'cafe',
  'hotel',
  'other',
]

type GoogleAutocompletePrediction = {
  description?: string
  place_id?: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GoogleAutocompleteResponse = {
  status?: string
  error_message?: string
  predictions?: GoogleAutocompletePrediction[]
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

    const input = String(searchParams.get('q') || '').trim()
    const placeTypeRaw = String(searchParams.get('placeType') || '').trim().toLowerCase()
    const destination = String(searchParams.get('destination') || '').trim()

    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const placeType: PlaceType = VALID_PLACE_TYPES.includes(placeTypeRaw as PlaceType)
      ? (placeTypeRaw as PlaceType)
      : 'other'

    const typeKeyword = mapPlaceTypeToGoogleType(placeType).replaceAll('_', ' ')

    const params = new URLSearchParams({
      input: `${input} ${typeKeyword}`.trim(),
      key: process.env.GOOGLE_MAPS_SERVER_API_KEY,
      language: 'en',
      types: 'establishment',
    })

    if (destination) {
      params.set('input', `${input} ${typeKeyword} ${destination}`.trim())
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      {
        cache: 'no-store',
      }
    )

    const payload = (await response.json()) as GoogleAutocompleteResponse

    if (!response.ok || (payload.status && payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS')) {
      return NextResponse.json(
        {
          error:
            payload.error_message ||
            (payload.status ? `Google Places error: ${payload.status}` : 'Failed to fetch suggestions.'),
        },
        { status: 502 }
      )
    }

    const suggestions = (payload.predictions || []).slice(0, 8).flatMap((prediction) => {
      if (!prediction.place_id || !prediction.description) {
        return []
      }

      return [
        {
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || '',
        },
      ]
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected error fetching place suggestions.',
      },
      { status: 500 }
    )
  }
}
