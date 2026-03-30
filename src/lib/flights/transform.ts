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
  input: { normalizedFlightNumber: string; flightDate: string; mode?: 'departure-day' | 'arrival-day' | 'either' }
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
  const mode = input.mode || 'either';

  // Debug: log all candidate rows and their dates
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[FlightLookup][transformAeroDataBoxLookupToFlight] candidates:', rows.map((row) => {
      if (!isRecord(row)) return null;
      const depDate = findArrivalDate(isRecord(row.departure) ? row.departure : {});
      const arrDate = findArrivalDate(isRecord(row.arrival) ? row.arrival : {});
      return {
        number: row.number,
        depDate,
        arrDate,
      };
    }));
  }

  let matchedRaw: unknown = null;
  if (mode === 'departure-day') {
    matchedRaw = rows.find((row) => {
      if (!isRecord(row)) return false;
      const depDate = findArrivalDate(isRecord(row.departure) ? row.departure : {});
      return depDate === normalizedDate;
    });
    if (!matchedRaw && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[FlightLookup][transformAeroDataBoxLookupToFlight] No departure-day match for', normalizedDate);
    }
  } else if (mode === 'arrival-day') {
    matchedRaw = rows.find((row) => {
      if (!isRecord(row)) return false;
      const arrDate = findArrivalDate(isRecord(row.arrival) ? row.arrival : {});
      return arrDate === normalizedDate;
    });
    if (!matchedRaw && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[FlightLookup][transformAeroDataBoxLookupToFlight] No arrival-day match for', normalizedDate);
    }
  } else {
    matchedRaw = rows.find((row) => {
      if (!isRecord(row)) return false;
      const depDate = findArrivalDate(isRecord(row.departure) ? row.departure : {});
      const arrDate = findArrivalDate(isRecord(row.arrival) ? row.arrival : {});
      return depDate === normalizedDate || arrDate === normalizedDate;
    });
  }

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
    // Add timezone fields if available
    departureAirportTimezone: asString(departureAirport?.timezone) || asString(departure?.timezone) || null,
    arrivalAirportCode: asString(arrivalAirport?.iata),
    arrivalAirportName: asString(arrivalAirport?.name),
    arrivalCity: asString(arrivalAirport?.municipalityName),
    arrivalTime: arrival ? extractDateTime(arrival) : null,
    arrivalTerminal: arrival ? extractTerminal(arrival) : null,
    arrivalAirportTimezone: asString(arrivalAirport?.timezone) || asString(arrival?.timezone) || null,
    status: asString(selectedRaw.status),
    aircraftModel: asString(aircraft?.model),
    dataProvider: 'aerodatabox',
    rawResponseJson: selectedRaw,
  }
}
