import type { SavedTripFlight } from '@/lib/flights/trip'

type FlightRouteMapProps = {
  flights: SavedTripFlight[]
}

type OrderedStop = {
  code: string
  name: string
}

function directionWeight(direction: SavedTripFlight['direction']) {
  switch (direction) {
    case 'outbound':
      return 0
    case 'unknown':
      return 1
    case 'return':
      return 2
    default:
      return 3
  }
}

function orderFlights(flights: SavedTripFlight[]) {
  return [...flights].sort((a, b) => {
    const weightDiff = directionWeight(a.direction) - directionWeight(b.direction)
    if (weightDiff !== 0) return weightDiff

    const timeA = Date.parse(a.selectedAt || a.updatedAt)
    const timeB = Date.parse(b.selectedAt || b.updatedAt)
    if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB
    }

    return a.normalizedFlightNumber.localeCompare(b.normalizedFlightNumber)
  })
}

function toStop(code: string | null, name: string | null, fallback: string): OrderedStop | null {
  if (!code && !name) return null

  const resolvedCode = code?.trim().toUpperCase() || fallback
  const resolvedName = name?.trim() || resolvedCode

  return {
    code: resolvedCode,
    name: resolvedName,
  }
}

function buildRouteStops(flights: SavedTripFlight[]): OrderedStop[] {
  const ordered = orderFlights(flights)
  const stops: OrderedStop[] = []

  for (const flight of ordered) {
    const departure = toStop(
      flight.departureAirportCode,
      flight.departureAirportName || flight.departureCity,
      'DEP'
    )
    const arrival = toStop(
      flight.arrivalAirportCode,
      flight.arrivalAirportName || flight.arrivalCity,
      'ARR'
    )

    if (departure) {
      const last = stops[stops.length - 1]
      if (!last || last.code !== departure.code) {
        stops.push(departure)
      }
    }

    if (arrival) {
      const last = stops[stops.length - 1]
      if (!last || last.code !== arrival.code) {
        stops.push(arrival)
      }
    }
  }

  return stops
}

function buildStaticMapUrl(stops: OrderedStop[]) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY?.trim()
  if (!key || stops.length < 2) {
    return null
  }

  const markerParams = stops
    .map((stop) => `markers=size:mid%7Ccolor:0x6B87B6%7Clabel:${encodeURIComponent(stop.code.slice(0, 1))}%7C${encodeURIComponent(stop.name)}`)
    .join('&')

  const pathPoints = stops.map((stop) => encodeURIComponent(stop.name)).join('%7C')
  const pathParam = `path=color:0x6B87B6%7Cweight:3%7C${pathPoints}`

  return `https://maps.googleapis.com/maps/api/staticmap?size=1200x420&scale=2&maptype=roadmap&${markerParams}&${pathParam}&key=${encodeURIComponent(key)}`
}

export default function FlightRouteMap({ flights }: FlightRouteMapProps) {
  if (flights.length < 2) {
    return null
  }

  const stops = buildRouteStops(flights)
  if (stops.length < 2) {
    return null
  }

  const mapUrl = buildStaticMapUrl(stops)
  const routeText = stops.map((stop) => stop.code).join(' → ')

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Journey Route</p>
        <p className="mt-1 text-sm text-[var(--text-strong)]">{routeText}</p>
      </div>

      {mapUrl ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white">
          <img
            src={mapUrl}
            alt={`Journey route map: ${routeText}`}
            className="h-auto w-full"
            loading="lazy"
          />
        </div>
      ) : null}
    </div>
  )
}