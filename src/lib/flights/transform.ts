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

// Extract terminal from either a flat property or via the legacy movement wrapper
function extractTerminal(record: UnknownRecord): string | null {
  const flat = asString(record.terminal) ?? asString(record.terminalName)
  if (flat) return flat
  const movement = isRecord(record.movement) ? record.movement : null
  return asString(movement?.terminal) ?? asString(movement?.terminalName)
}

// Extract datetime string from:
//   - record.scheduledTime.local (current AeroDataBox schema)
//   - record.scheduledTime.utc
//   - record.movement.scheduledTime.local (legacy schema)
//   - record.movement.scheduledTime.utc
//   - various other variants seen across API versions
function extractDateTime(record: UnknownRecord): string | null {
  // Current schema: departure.scheduledTime.{local,utc}
  const scheduled = isRecord(record.scheduledTime) ? record.scheduledTime : null
  const actual = isRecord(record.actualTime) ? record.actualTime : null
  const predicted = isRecord(record.predictedTime) ? record.predictedTime : null
  const revised = isRecord(record.revisedTime) ? record.revisedTime : null

  // Prefer local time; fall back to utc if needed
  for (const slot of [scheduled, actual, predicted, revised]) {
    const t = asString(slot?.local) ?? asString(slot?.utc)
    if (t) return t
  }

  // Legacy schema: departure.movement.scheduledTime.{local,utc}
  const movement = isRecord(record.movement) ? record.movement : null
  for (const key of ['scheduledTime', 'actualTime', 'revisedTime']) {
    const slot = isRecord((movement as UnknownRecord | null)?.[key]) ? (movement as UnknownRecord)[key] as UnknownRecord : null
    const t = asString(slot?.local) ?? asString(slot?.utc)
    if (t) return t
  }

  // Flat string fallbacks
  return (
    asString(record.scheduledTimeLocal) ??
    asString(record.scheduledTimeUtc) ??
    asString(record.time) ??
    null
  )
}

function findArrivalDate(record: UnknownRecord): string | null {
  const dt = extractDateTime(record)
  if (!dt || !/^\d{4}-\d{2}-\d{2}/.test(dt)) return null
  return dt.slice(0, 10)
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
    departureTime: departure ? extractDateTime(departure) : null,
    departureTerminal: departure ? extractTerminal(departure) : null,
    arrivalAirportCode: asString(arrivalAirport?.iata),
    arrivalAirportName: asString(arrivalAirport?.name),
    arrivalCity: asString(arrivalAirport?.municipalityName),
    arrivalTime: arrival ? extractDateTime(arrival) : null,
    arrivalTerminal: arrival ? extractTerminal(arrival) : null,
    status: asString(selectedRaw.status),
    aircraftModel: asString(aircraft?.model),
    dataProvider: 'aerodatabox',
    rawResponseJson: selectedRaw,
  }
}


function dateFromIsoLike(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return null
  }

  return value.slice(0, 10)
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = asString(value)
    if (parsed) return parsed
  }

  return null
}

function extractMovement(record: UnknownRecord): UnknownRecord | null {
  return isRecord(record.movement) ? record.movement : null
}

function extractTimeRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null
}

function extractDateTime(record: UnknownRecord): string | null {
  const movement = extractMovement(record)
  const movementScheduled = extractTimeRecord(movement?.scheduledTime)
  const movementActual = extractTimeRecord(movement?.actualTime)
  const movementRevised = extractTimeRecord(movement?.revisedTime)

  const scheduled = extractTimeRecord(record.scheduledTime)
  const actual = extractTimeRecord(record.actualTime)
  const revised = extractTimeRecord(record.revisedTime)

  return firstString(
    movementScheduled?.local,
    movementScheduled?.dateLocal,
    movementScheduled?.utc,
    movementScheduled?.dateUtc,
    movementActual?.local,
    movementActual?.dateLocal,
    movementActual?.utc,
    movementActual?.dateUtc,
    movementRevised?.local,
    movementRevised?.dateLocal,
    movementRevised?.utc,
    movementRevised?.dateUtc,
    scheduled?.local,
    scheduled?.dateLocal,
    scheduled?.utc,
    scheduled?.dateUtc,
    actual?.local,
    actual?.dateLocal,
    actual?.utc,
    actual?.dateUtc,
    revised?.local,
    revised?.dateLocal,
    revised?.utc,
    revised?.dateUtc,
    record.scheduledTimeLocal,
    record.scheduledTimeUtc,
    record.actualTimeLocal,
    record.actualTimeUtc,
    record.revisedTimeLocal,
    record.revisedTimeUtc,
    record.scheduledTime,
    record.actualTime,
    record.revisedTime,
    record.time
  )
}

function extractTerminal(record: UnknownRecord): string | null {
  const movement = extractMovement(record)

  return firstString(
    movement?.terminal,
    movement?.terminalName,
    record.terminal,
    record.terminalName
  )
}

function findArrivalDate(record: UnknownRecord): string | null {
  return dateFromIsoLike(extractDateTime(record))
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
  const aircraft = isRecord(selectedRaw.aircraft) ? selectedRaw.aircraft : null

  const departureDateTime = departure ? extractDateTime(departure) : null
  const arrivalDateTime = arrival ? extractDateTime(arrival) : null

  return {
    normalizedFlightNumber: input.normalizedFlightNumber,
    flightDate: input.flightDate,
    airlineName: asString(airline?.name),
    airlineCode: asString(airline?.iata),
    flightNumber: asString(selectedRaw.number) || input.normalizedFlightNumber,
    departureAirportCode: asString(departureAirport?.iata),
    departureAirportName: asString(departureAirport?.name),
    departureCity: asString(departureAirport?.municipalityName),
    departureTime: departureDateTime,
    departureTerminal: departure ? extractTerminal(departure) : null,
    arrivalAirportCode: asString(arrivalAirport?.iata),
    arrivalAirportName: asString(arrivalAirport?.name),
    arrivalCity: asString(arrivalAirport?.municipalityName),
    arrivalTime: arrivalDateTime,
    arrivalTerminal: arrival ? extractTerminal(arrival) : null,
    status: asString(selectedRaw.status),
    aircraftModel: asString(aircraft?.model),
    dataProvider: 'aerodatabox',
    rawResponseJson: selectedRaw,
  }
}
