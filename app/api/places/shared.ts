export type OsmPlaceSuggestion = {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

export type OsmLookupResult = {
  display_name?: string
  lat?: string
  lon?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    country?: string
  }
}

export function toExternalPlaceId(osmType: string, osmId: string | number) {
  return `osm:${osmType}:${osmId}`
}

export function parseExternalPlaceId(externalPlaceId: string) {
  const [prefix, osmType, osmId] = externalPlaceId.split(':')

  if (prefix !== 'osm' || !osmType || !osmId) {
    return null
  }

  return { osmType, osmId }
}

export function toOsmLookupId(osmType: string, osmId: string) {
  const normalizedType = osmType.toLowerCase()
  if (normalizedType.startsWith('n')) return `N${osmId}`
  if (normalizedType.startsWith('w')) return `W${osmId}`
  if (normalizedType.startsWith('r')) return `R${osmId}`
  return null
}

export function extractCity(address: OsmLookupResult['address']) {
  if (!address) return null
  return address.city || address.town || address.village || address.municipality || null
}
