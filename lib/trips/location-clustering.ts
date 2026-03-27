import type { TripLocation, TripLocationCluster } from './locations'

export function clusterLocationsByCountry(locations: TripLocation[]): TripLocationCluster[] {
  const orderedCountries: string[] = []
  const byCountry = new Map<string, TripLocation[]>()

  for (const location of locations) {
    const country = (location.country || location.name).trim() || 'Other'

    if (!byCountry.has(country)) {
      byCountry.set(country, [])
      orderedCountries.push(country)
    }

    byCountry.get(country)!.push(location)
  }

  return orderedCountries.map((country) => ({
    clusterName: country,
    type: 'country',
    locations: byCountry.get(country) || [],
  }))
}
