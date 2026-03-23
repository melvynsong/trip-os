import { type PlaceType } from '@/lib/places'

export type GooglePlaceSearchResult = {
  placeId: string
  name: string
  formattedAddress: string
  types: string[]
  primaryType: string | null
  primaryTypeDisplayName: string | null
}

export type GooglePlaceDetails = {
  provider: 'google'
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  rating: number | null
  userRatingsTotal: number | null
  types: string[]
  primaryType: string | null
  primaryTypeDisplayName: string | null
  googleMapsUri: string | null
}

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1'
const SEARCH_CACHE_TTL_MS = 60_000
const DETAILS_CACHE_TTL_MS = 5 * 60_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_SEARCH = 25
const RATE_LIMIT_MAX_DETAILS = 40

const searchCache = new Map<string, { expiresAt: number; data: GooglePlaceSearchResult[] }>()
const detailsCache = new Map<string, { expiresAt: number; data: GooglePlaceDetails }>()
const rateLimitStore = new Map<string, { windowStart: number; searchCount: number; detailsCount: number }>()

function getApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured.')
  }

  return apiKey
}

function normalizePlaceTypeForGoogle(placeType: PlaceType): string | null {
  switch (placeType) {
    case 'restaurant':
      return 'restaurant'
    case 'cafe':
      return 'cafe'
    case 'hotel':
      return 'lodging'
    case 'shopping':
      return 'shopping_mall'
    case 'attraction':
      return 'tourist_attraction'
    case 'other':
    default:
      return null
  }
}

function getRateLimitBucket(key: string) {
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    const fresh = { windowStart: now, searchCount: 0, detailsCount: 0 }
    rateLimitStore.set(key, fresh)
    return fresh
  }

  return existing
}

export function enforceGooglePlacesRateLimit(key: string, kind: 'search' | 'details') {
  const bucket = getRateLimitBucket(key)

  if (kind === 'search') {
    bucket.searchCount += 1
    if (bucket.searchCount > RATE_LIMIT_MAX_SEARCH) {
      throw new Error('Search rate limit exceeded. Please wait a moment and try again.')
    }
    return
  }

  bucket.detailsCount += 1
  if (bucket.detailsCount > RATE_LIMIT_MAX_DETAILS) {
    throw new Error('Details rate limit exceeded. Please wait a moment and try again.')
  }
}

function getCachedSearch(key: string) {
  const cached = searchCache.get(key)
  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    searchCache.delete(key)
    return null
  }
  return cached.data
}

function setCachedSearch(key: string, data: GooglePlaceSearchResult[]) {
  searchCache.set(key, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, data })
}

function getCachedDetails(key: string) {
  const cached = detailsCache.get(key)
  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    detailsCache.delete(key)
    return null
  }
  return cached.data
}

function setCachedDetails(key: string, data: GooglePlaceDetails) {
  detailsCache.set(key, { expiresAt: Date.now() + DETAILS_CACHE_TTL_MS, data })
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function formatAddress(value?: string | null) {
  return value?.trim() || ''
}

export async function searchGooglePlaces(input: {
  query: string
  destination: string
  placeType: PlaceType
  sessionToken?: string
}) {
  const normalizedQuery = normalizeQuery(input.query)
  const normalizedDestination = normalizeQuery(input.destination)
  const includedPrimaryType = normalizePlaceTypeForGoogle(input.placeType)
  const cacheKey = `${normalizedQuery}|${normalizedDestination}|${input.placeType}`

  const cached = getCachedSearch(cacheKey)
  if (cached) {
    return cached
  }

  const body: {
    input: string
    includedPrimaryTypes?: string[]
    languageCode: string
    sessionToken?: string
  } = {
    input: [input.query.trim(), input.destination.trim()].filter(Boolean).join(' '),
    languageCode: 'en',
  }

  if (includedPrimaryType) {
    body.includedPrimaryTypes = [includedPrimaryType]
  }

  if (input.sessionToken) {
    body.sessionToken = input.sessionToken
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:autocomplete`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': [
        'suggestions.placePrediction.placeId',
        'suggestions.placePrediction.text.text',
        'suggestions.placePrediction.structuredFormat.mainText.text',
        'suggestions.placePrediction.structuredFormat.secondaryText.text',
        'suggestions.placePrediction.types',
      ].join(','),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Google autocomplete failed: ${payload}`)
  }

  const payload = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string
        text?: { text?: string }
        structuredFormat?: {
          mainText?: { text?: string }
          secondaryText?: { text?: string }
        }
        types?: string[]
      }
    }>
  }

  const results = (payload.suggestions || [])
    .flatMap((item) => {
      const prediction = item.placePrediction
      if (!prediction?.placeId || !prediction.text?.text) {
        return []
      }

      const name = prediction.structuredFormat?.mainText?.text || prediction.text.text
      const formattedAddress = prediction.structuredFormat?.secondaryText?.text || ''
      return [
        {
          placeId: prediction.placeId,
          name,
          formattedAddress,
          types: prediction.types || [],
          primaryType: prediction.types?.[0] || null,
          primaryTypeDisplayName: null,
        } satisfies GooglePlaceSearchResult,
      ]
    })
    .slice(0, 5)

  setCachedSearch(cacheKey, results)
  return results
}

export async function getGooglePlaceDetails(placeId: string, sessionToken?: string) {
  const cacheKey = placeId.trim()
  const cached = getCachedDetails(cacheKey)
  if (cached) {
    return cached
  }

  const params = new URLSearchParams()
  if (sessionToken) {
    params.set('sessionToken', sessionToken)
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(cacheKey)}${params.toString() ? `?${params.toString()}` : ''}`, {
    cache: 'no-store',
    headers: {
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'rating',
        'userRatingCount',
        'types',
        'primaryType',
        'primaryTypeDisplayName',
        'googleMapsUri',
      ].join(','),
    },
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Google place details failed: ${payload}`)
  }

  const payload = (await response.json()) as {
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    location?: { latitude?: number; longitude?: number }
    rating?: number
    userRatingCount?: number
    types?: string[]
    primaryType?: string
    primaryTypeDisplayName?: { text?: string }
    googleMapsUri?: string
  }

  if (
    !payload.id ||
    !payload.displayName?.text ||
    typeof payload.location?.latitude !== 'number' ||
    typeof payload.location?.longitude !== 'number'
  ) {
    throw new Error('Incomplete place details returned by Google.')
  }

  const details: GooglePlaceDetails = {
    provider: 'google',
    placeId: payload.id,
    name: payload.displayName.text,
    address: formatAddress(payload.formattedAddress),
    lat: payload.location.latitude,
    lng: payload.location.longitude,
    rating: typeof payload.rating === 'number' ? payload.rating : null,
    userRatingsTotal: typeof payload.userRatingCount === 'number' ? payload.userRatingCount : null,
    types: payload.types || [],
    primaryType: payload.primaryType || null,
    primaryTypeDisplayName: payload.primaryTypeDisplayName?.text || null,
    googleMapsUri: payload.googleMapsUri || null,
  }

  setCachedDetails(cacheKey, details)
  return details
}

export function deriveAppPlaceTypeFromGoogle(primaryType: string | null, types: string[]): PlaceType {
  const allTypes = [primaryType, ...types].filter(Boolean).join(' ').toLowerCase()

  if (allTypes.includes('restaurant') || allTypes.includes('meal_takeaway')) return 'restaurant'
  if (allTypes.includes('cafe') || allTypes.includes('coffee')) return 'cafe'
  if (allTypes.includes('hotel') || allTypes.includes('lodging') || allTypes.includes('resort')) return 'hotel'
  if (allTypes.includes('shopping') || allTypes.includes('store') || allTypes.includes('mall')) return 'shopping'
  if (allTypes.includes('museum') || allTypes.includes('park') || allTypes.includes('tourist_attraction') || allTypes.includes('art_gallery')) return 'attraction'

  return 'other'
}
