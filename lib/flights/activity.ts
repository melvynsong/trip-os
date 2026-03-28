// Parses a duration string like "4h 25m", "1h 10m", "55m" into minutes
export function parseFlightDuration(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const hMatch = duration.match(/(\d+)\s*h/);
  const mMatch = duration.match(/(\d+)\s*m/);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
  if (isNaN(hours) && isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// Given departure datetime (ISO), duration (min), and optional explicit arrival, returns arrival datetime (ISO)
export function deriveFlightArrivalDateTime(
  departureDateTime: string,
  durationMinutes: number | null,
  explicitArrival?: string | null
): string | null {
  if (explicitArrival && explicitArrival.trim()) {
    return explicitArrival;
  }
  if (!departureDateTime || durationMinutes == null) return null;
  const dep = new Date(departureDateTime);
  if (isNaN(dep.getTime())) return null;
  const arr = new Date(dep.getTime() + durationMinutes * 60000);
  return arr.toISOString();
}
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
