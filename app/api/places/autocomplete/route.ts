import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapPlaceTypeToSearchKeyword, type PlaceType } from '@/lib/places'
import { branding } from '@/lib/branding'
import { toExternalPlaceId } from '@/app/api/places/shared'

export const runtime = 'nodejs'

const VALID_PLACE_TYPES: PlaceType[] = [
  'attraction',
  'restaurant',
  'shopping',
  'cafe',
  'hotel',
  'other',
]

type NominatimSearchResult = {
  display_name?: string
  name?: string
  osm_type?: string
  osm_id?: number
}

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

    const input = String(searchParams.get('q') || '').trim()
    const placeTypeRaw = String(searchParams.get('placeType') || '').trim().toLowerCase()
    const destination = String(searchParams.get('destination') || '').trim()

    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const placeType: PlaceType = VALID_PLACE_TYPES.includes(placeTypeRaw as PlaceType)
      ? (placeTypeRaw as PlaceType)
      : 'other'

    const typeKeyword = mapPlaceTypeToSearchKeyword(placeType)
    const q = `${input} ${typeKeyword} ${destination}`.trim()

    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '8',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': `${branding.appName}/1.0 (places search)`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch place suggestions.' }, { status: 502 })
    }

    const payload = (await response.json()) as NominatimSearchResult[]

    const suggestions = payload.slice(0, 8).flatMap((item) => {
      if (!item.display_name || !item.osm_type || !item.osm_id) {
        return []
      }

      const parts = item.display_name.split(',').map((part) => part.trim())

      return [
        {
          placeId: toExternalPlaceId(item.osm_type, item.osm_id),
          description: item.display_name,
          mainText: item.name || parts[0] || item.display_name,
          secondaryText: parts.slice(1).join(', '),
        },
      ]
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error fetching place suggestions.',
      },
      { status: 500 }
    )
  }
}
