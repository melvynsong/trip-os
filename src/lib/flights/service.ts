import { AeroDataBoxApiError, lookupAeroDataBoxFlight } from './aerodatabox'
import { transformAeroDataBoxLookupToFlight } from './transform'
import type { FlightLookupInput, FlightLookupResult, NormalizedFlightNumber } from './types'

const AIRLINE_CODE_RE = /^[A-Z]{2,3}$/
const NUMBER_RE = /^\d{1,4}[A-Z]?$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function normalizeRawFlightNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeFlightNumber(input: unknown): NormalizedFlightNumber {
  const raw = typeof input === 'string' ? normalizeRawFlightNumber(input) : ''

  const match = /^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/.exec(raw)
  if (!match) {
    throw new AeroDataBoxApiError('Use a valid flight number, for example SQ895 or SQ 895.', 400)
  }

  const airlineCode = match[1]
  const flightNumber = match[2]

  if (!AIRLINE_CODE_RE.test(airlineCode) || !NUMBER_RE.test(flightNumber)) {
    throw new AeroDataBoxApiError('Use a valid flight number, for example SQ895 or SQ 895.', 400)
  }

  return {
    normalized: `${airlineCode} ${flightNumber}`,
    airlineCode,
    flightNumber,
  }
}

export function validateFlightLookupInput(input: unknown): FlightLookupInput {
  const source = typeof input === 'object' && input !== null ? (input as Partial<FlightLookupInput>) : {}
  const flightNumber = typeof source.flightNumber === 'string' ? source.flightNumber : ''
  const flightDate = typeof source.flightDate === 'string' ? source.flightDate.trim() : ''

  if (!flightNumber.trim()) {
    throw new AeroDataBoxApiError('Flight number is required.', 400)
  }

  if (!DATE_RE.test(flightDate)) {
    throw new AeroDataBoxApiError('Flight date must use YYYY-MM-DD format.', 400)
  }

  return {
    flightNumber,
    flightDate,
  }
}

export async function lookupFlightByNumberAndDate(
  input: FlightLookupInput
): Promise<FlightLookupResult | null> {
  const normalized = normalizeFlightNumber(input.flightNumber)
  const raw = await lookupAeroDataBoxFlight({
    flightNumber: input.flightNumber,
    flightDate: input.flightDate,
    normalizedFlightNumber: normalized.normalized,
  })

  return transformAeroDataBoxLookupToFlight(raw, {
    normalizedFlightNumber: normalized.normalized,
    flightDate: input.flightDate,
  })
}
