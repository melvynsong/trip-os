import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { branding } from '@/lib/branding'
import type { TripLocation, TripLocationType } from '@/lib/trips/locations'

export const runtime = 'nodejs'

type NominatimResult = {
  display_name?: string
  lat?: string
  lon?: string
  osm_type?: string
  osm_id?: number
  addresstype?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    country?: string
    country_code?: string
  }
  name?: string
}

const POPULAR_TERMS = new Set([
  'tokyo',
  'osaka',
  'kyoto',
  'seoul',
  'singapore',
  'paris',
  'london',
  'rome',
  'bangkok',
  'bali',
  'japan',
  'korea',
  'italy',
  'france',
  'thailand',
])

function inferType(row: NominatimResult): TripLocationType | null {
  const type = (row.addresstype || '').toLowerCase().trim()
  if (type === 'country') return 'country'

  const cityTokens = new Set([
    'city',
    'town',
    'village',
    'municipality',
    'hamlet',
    'county',
    'state_district',
  ])

  if (cityTokens.has(type)) return 'city'

  if (row.address?.city || row.address?.town || row.address?.village || row.address?.municipality) {
    return 'city'
  }

  return null
}

function buildName(row: NominatimResult, type: TripLocationType): string {
  if (type === 'country') {
    return row.address?.country || row.name || row.display_name || 'Unknown country'
  }

  return (
    row.address?.city ||
    row.address?.town ||
    row.address?.village ||
    row.address?.municipality ||
    row.name ||
    row.display_name ||
    'Unknown city'
  )
}

function scoreSuggestion(location: TripLocation): number {
  const terms = `${location.name} ${location.country || ''}`.toLowerCase()
  let score = 0
  for (const term of POPULAR_TERMS) {
    if (terms.includes(term)) score += 1
  }
  if (location.type === 'city') score += 0.5
  return score
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

    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const query = new URLSearchParams({
      q: input,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '10',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': `${branding.appName}/1.0 (trip location search)`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch locations.' }, { status: 502 })
    }

    const payload = (await response.json()) as NominatimResult[]

    const suggestions = payload
      .flatMap((row): TripLocation[] => {
        const type = inferType(row)
        if (!type || !row.osm_type || !row.osm_id) return []

        const location: TripLocation = {
          name: buildName(row, type),
          country: row.address?.country || null,
          type,
          placeId: `osm:${row.osm_type}:${row.osm_id}`,
          lat: row.lat ? Number(row.lat) : null,
          lng: row.lon ? Number(row.lon) : null,
        }

        if (!location.name.trim()) return []
        return [location]
      })
      .sort((a, b) => scoreSuggestion(b) - scoreSuggestion(a))

    const unique = new Map<string, TripLocation>()
    for (const suggestion of suggestions) {
      if (!unique.has(suggestion.placeId)) {
        unique.set(suggestion.placeId, suggestion)
      }
    }

    return NextResponse.json({ suggestions: Array.from(unique.values()).slice(0, 8) })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error fetching locations.',
      },
      { status: 500 }
    )
  }
}
