export type FlightDirection = 'outbound' | 'return' | 'unknown'

export type FlightLookupInput = {
  flightNumber: string
  flightDate: string
}

export type NormalizedFlightNumber = {
  normalized: string
  airlineCode: string
  flightNumber: string
}

export type FlightLookupResult = {
  normalizedFlightNumber: string
  flightDate: string
  airlineName: string | null
  airlineCode: string | null
  flightNumber: string
  departureAirportCode: string | null
  departureAirportName: string | null
  departureCity: string | null
  departureTime: string | null
  departureTerminal: string | null
  departureAirportTimezone?: string | null
  arrivalAirportCode: string | null
  arrivalAirportName: string | null
  arrivalCity: string | null
  arrivalTime: string | null
  arrivalTerminal: string | null
  arrivalAirportTimezone?: string | null
  status: string | null
  aircraftModel: string | null
  dataProvider: 'aerodatabox' | 'manual' | 'cache'
  rawResponseJson?: unknown
}
