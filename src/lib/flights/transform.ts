import type { FlightLookupResult } from './types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function firstFromArray(value: unknown): unknown | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return value[0]
}

function findArrivalDate(record: UnknownRecord): string | null {
  const movement = isRecord(record.movement) ? record.movement : null
  const scheduledTime = isRecord(movement?.scheduledTime) ? movement?.scheduledTime : null
  const local = asString(scheduledTime?.local)

  if (!local || !/^\d{4}-\d{2}-\d{2}/.test(local)) {
    return null
  }

  return local.slice(0, 10)
}

export function transformAeroDataBoxLookupToFlight(
  payload: unknown,
  input: { normalizedFlightNumber: string; flightDate: string }
): FlightLookupResult | null {
  const rows = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : []

  if (rows.length === 0) {
    return null
  }

  const normalizedDate = input.flightDate

  const matchedRaw = rows.find((row) => {
    if (!isRecord(row)) return false
    const depDate = findArrivalDate(isRecord(row.departure) ? row.departure : {})
    const arrDate = findArrivalDate(isRecord(row.arrival) ? row.arrival : {})
    return depDate === normalizedDate || arrDate === normalizedDate
  })

  const selectedRaw = isRecord(matchedRaw)
    ? matchedRaw
    : isRecord(firstFromArray(rows))
      ? (firstFromArray(rows) as UnknownRecord)
      : null

  if (!selectedRaw) {
    return null
  }

  const airline = isRecord(selectedRaw.airline) ? selectedRaw.airline : null
  const departure = isRecord(selectedRaw.departure) ? selectedRaw.departure : null
  const arrival = isRecord(selectedRaw.arrival) ? selectedRaw.arrival : null
  const departureAirport = isRecord(departure?.airport) ? departure?.airport : null
  const arrivalAirport = isRecord(arrival?.airport) ? arrival?.airport : null
  const departureMovement = isRecord(departure?.movement) ? departure?.movement : null
  const arrivalMovement = isRecord(arrival?.movement) ? arrival?.movement : null
  const departureScheduled = isRecord(departureMovement?.scheduledTime) ? departureMovement?.scheduledTime : null
  const arrivalScheduled = isRecord(arrivalMovement?.scheduledTime) ? arrivalMovement?.scheduledTime : null
  const aircraft = isRecord(selectedRaw.aircraft) ? selectedRaw.aircraft : null

  return {
    normalizedFlightNumber: input.normalizedFlightNumber,
    flightDate: input.flightDate,
    airlineName: asString(airline?.name),
    airlineCode: asString(airline?.iata),
    flightNumber: asString(selectedRaw.number) || input.normalizedFlightNumber,
    departureAirportCode: asString(departureAirport?.iata),
    departureAirportName: asString(departureAirport?.name),
    departureCity: asString(departureAirport?.municipalityName),
    departureTime: asString(departureScheduled?.local),
    departureTerminal: asString(departureMovement?.terminal),
    arrivalAirportCode: asString(arrivalAirport?.iata),
    arrivalAirportName: asString(arrivalAirport?.name),
    arrivalCity: asString(arrivalAirport?.municipalityName),
    arrivalTime: asString(arrivalScheduled?.local),
    arrivalTerminal: asString(arrivalMovement?.terminal),
    status: asString(selectedRaw.status),
    aircraftModel: asString(aircraft?.model),
    dataProvider: 'aerodatabox',
    rawResponseJson: selectedRaw,
  }
}
