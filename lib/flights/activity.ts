import type { ActivityType } from '@/types/trip'

type FlightActivityInput = {
  type: ActivityType | string
  title?: string | null
  notes?: string | null
}

type FlightLocationInput = {
  city?: string | null
  airportName?: string | null
  airportCode?: string | null
}

export function isLikelyFlightActivity(input: FlightActivityInput): boolean {
  if (input.type !== 'transport') return false

  const text = `${input.title || ''} ${input.notes || ''}`.toLowerCase()
  if (!text.trim()) return false

  return /(flight|airport|airline|boarding|gate|terminal|departs?|arrives?|takeoff|landing|iata)/.test(text)
}

function compactLocation(input: FlightLocationInput): string | null {
  const city = input.city?.trim()
  const airportName = input.airportName?.trim()
  const airportCode = input.airportCode?.trim()

  if (city) return city
  if (airportName) return airportName
  if (airportCode) return airportCode
  return null
}

export function buildFlightTimelineTitle(
  kind: 'departure' | 'arrival',
  input: FlightLocationInput
): string {
  const location = compactLocation(input)

  if (!location) {
    return kind === 'departure' ? 'Flight departure' : 'Flight arrival'
  }

  if (kind === 'departure') {
    return `Depart ${location}`
  }

  return `Arrive in ${location}`
}
