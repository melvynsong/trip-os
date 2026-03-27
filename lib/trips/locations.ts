export type TripLocationType = 'city' | 'country'

export type TripLocation = {
  name: string
  country: string | null
  type: TripLocationType
  placeId: string
  lat: number | null
  lng: number | null
}

export type TripLocationCluster = {
  clusterName: string
  type: 'country'
  locations: TripLocation[]
}

export function formatTripLocationLabel(location: TripLocation): string {
  const country = location.country?.trim()
  if (country && country.toLowerCase() !== location.name.trim().toLowerCase()) {
    return `${location.name}, ${country}`
  }
  return location.name
}

export function isSameTripLocation(a: TripLocation, b: TripLocation): boolean {
  return a.placeId === b.placeId
}

export function buildPrimaryDestination(locations: TripLocation[]): string {
  if (locations.length === 0) return ''
  return formatTripLocationLabel(locations[0])
}

export function uniqueByPlaceId(locations: TripLocation[]): TripLocation[] {
  const seen = new Set<string>()
  const unique: TripLocation[] = []

  for (const location of locations) {
    if (seen.has(location.placeId)) continue
    seen.add(location.placeId)
    unique.push(location)
  }

  return unique
}
