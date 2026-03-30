import type { SupabaseClient } from '@supabase/supabase-js'
import { buildFlightTimelineTitle } from '@/lib/flights/activity'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'
import type { FlightActivity } from '@/lib/trips/flight-activity'

type TripFlightRow = {
  id: string
  trip_id: string
  direction: FlightDirection
  normalized_flight_number: string
  flight_date: string
  airline_code: string
  airline_name: string | null
  flight_number: string
  departure_airport_code: string
  departure_airport_name: string | null
  departure_city: string | null
  departure_time: string
  departure_terminal: string | null
  arrival_airport_code: string
  arrival_airport_name: string | null
  arrival_city: string | null
  arrival_time: string
  arrival_terminal: string | null
  status: string | null
  aircraft_model: string | null
  data_provider: string
  raw_response_json: unknown
  selected_at: string
  updated_at: string
  duration?: string | null
}

type DayRow = {
  id: string
  date: string
  day_number: number
}

export type SavedTripFlight = {
  id: string
  tripId: string
  direction: FlightDirection
  normalizedFlightNumber: string
  flightDate: string
  airlineCode: string
  airlineName: string | null
  flightNumber: string
  departureAirportCode: string
  departureAirportName: string | null
  departureCity: string | null
  departureTime: string
  departureTerminal: string | null
  departureAirportTimezone?: string | null
  arrivalAirportCode: string
  arrivalAirportName: string | null
  arrivalCity: string | null
  arrivalTime: string
  arrivalTerminal: string | null
  arrivalAirportTimezone?: string | null
  status: string | null
  aircraftModel: string | null
  dataProvider: string
  rawResponseJson: unknown
  selectedAt: string
  updatedAt: string
  duration?: string | null
}

function toSavedTripFlight(row: TripFlightRow): SavedTripFlight {
  return {
    id: row.id,
    tripId: row.trip_id,
    direction: row.direction,
    normalizedFlightNumber: row.normalized_flight_number,
    flightDate: row.flight_date,
    airlineCode: row.airline_code,
    airlineName: row.airline_name,
    flightNumber: row.flight_number,
    departureAirportCode: row.departure_airport_code,
    departureAirportName: row.departure_airport_name,
    departureCity: row.departure_city,
    departureTime: row.departure_time,
    departureTerminal: row.departure_terminal,
    arrivalAirportCode: row.arrival_airport_code,
    arrivalAirportName: row.arrival_airport_name,
    arrivalCity: row.arrival_city,
    arrivalTime: row.arrival_time,
    arrivalTerminal: row.arrival_terminal,
    status: row.status,
    aircraftModel: row.aircraft_model,
    dataProvider: row.data_provider,
    rawResponseJson: row.raw_response_json,
    selectedAt: row.selected_at,
    updatedAt: row.updated_at,
    duration: row.duration ?? null,
  }
}

export async function listTripFlights(
  supabase: SupabaseClient,
  tripId: string
): Promise<SavedTripFlight[]> {
  const { data, error } = await supabase
    .from('trip_flights')
    .select(
      'id, trip_id, direction, normalized_flight_number, flight_date, airline_code, airline_name, flight_number, departure_airport_code, departure_airport_name, departure_city, departure_time, departure_terminal, arrival_airport_code, arrival_airport_name, arrival_city, arrival_time, arrival_terminal, status, aircraft_model, data_provider, raw_response_json, selected_at, updated_at'
    )
    .eq('trip_id', tripId)
    .order('direction', { ascending: true })
    .returns<TripFlightRow[]>()

  if (error || !data) {
    return []
  }

  return data.map(toSavedTripFlight)
}

export async function saveTripFlightSelection(input: {
  supabase: SupabaseClient
  tripId: string
  direction: FlightDirection
  flight: FlightLookupResult
}): Promise<SavedTripFlight> {
  const row = {
    trip_id: input.tripId,
    direction: input.direction,
    normalized_flight_number: input.flight.normalizedFlightNumber,
    flight_date: input.flight.flightDate,
    airline_code: input.flight.airlineCode || input.flight.normalizedFlightNumber.split(' ')[0] || '—',
    airline_name: input.flight.airlineName,
    flight_number: input.flight.flightNumber,
    departure_airport_code: input.flight.departureAirportCode || '—',
    departure_airport_name: input.flight.departureAirportName,
    departure_city: input.flight.departureCity,
    departure_time: input.flight.departureTime || `${input.flight.flightDate}T00:00:00`,
    departure_terminal: input.flight.departureTerminal,
    arrival_airport_code: input.flight.arrivalAirportCode || '—',
    arrival_airport_name: input.flight.arrivalAirportName,
    arrival_city: input.flight.arrivalCity,
    arrival_time: input.flight.arrivalTime || `${input.flight.flightDate}T00:00:00`,
    arrival_terminal: input.flight.arrivalTerminal,
    status: input.flight.status,
    aircraft_model: input.flight.aircraftModel,
    data_provider: input.flight.dataProvider,
    raw_response_json: input.flight.rawResponseJson ?? null,
    selected_at: new Date().toISOString(),
  }

  const { data, error } = await input.supabase
    .from('trip_flights')
    .upsert(row, { onConflict: 'trip_id,direction' })
    .select(
      'id, trip_id, direction, normalized_flight_number, flight_date, airline_code, airline_name, flight_number, departure_airport_code, departure_airport_name, departure_city, departure_time, departure_terminal, arrival_airport_code, arrival_airport_name, arrival_city, arrival_time, arrival_terminal, status, aircraft_model, data_provider, raw_response_json, selected_at, updated_at'
    )
    .single<TripFlightRow>()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save flight selection.')
  }

  return toSavedTripFlight(data)
}

export async function findTripFlightByLookup(input: {
  supabase: SupabaseClient
  tripId: string
  normalizedFlightNumber: string
  flightDate: string
}): Promise<SavedTripFlight | null> {
  const { data, error } = await input.supabase
    .from('trip_flights')
    .select(
      'id, trip_id, direction, normalized_flight_number, flight_date, airline_code, airline_name, flight_number, departure_airport_code, departure_airport_name, departure_city, departure_time, departure_terminal, arrival_airport_code, arrival_airport_name, arrival_city, arrival_time, arrival_terminal, status, aircraft_model, data_provider, raw_response_json, selected_at, updated_at'
    )
    .eq('trip_id', input.tripId)
    .eq('normalized_flight_number', input.normalizedFlightNumber)
    .eq('flight_date', input.flightDate)
    .limit(1)
    .maybeSingle<TripFlightRow>()

  if (error || !data) {
    return null
  }

  return toSavedTripFlight(data)
}

function getDatePart(dateTime: string): string | null {
  return /^\d{4}-\d{2}-\d{2}/.test(dateTime) ? dateTime.slice(0, 10) : null
}

function getTimePart(dateTime: string): string | null {
  const match = /[T\s](\d{2}:\d{2})/.exec(dateTime)
  return match ? match[1] : null
}

function getDurationLabel(departureTime: string, arrivalTime: string): string | null {
  const departure = new Date(departureTime)
  const arrival = new Date(arrivalTime)

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return null
  }

  const diffMs = arrival.getTime() - departure.getTime()
  if (diffMs <= 0) return null

  const totalMinutes = Math.round(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function isBefore(a: string, b: string): boolean {
  return a < b
}

function isAfter(a: string, b: string): boolean {
  return a > b
}

function resolveDay(days: DayRow[], eventDate: string, kind: 'departure' | 'arrival'): DayRow | null {
  const exact = days.find((day) => day.date === eventDate)
  if (exact) return exact
  if (days.length === 0) return null

  const first = days[0]
  const last = days[days.length - 1]

  if (kind === 'departure' && isBefore(eventDate, first.date)) {
    return first
  }

  if (kind === 'arrival' && isAfter(eventDate, last.date)) {
    return last
  }

  return null
}

function buildFlightNote(
  flight: SavedTripFlight,
  kind: 'departure' | 'arrival',
  usedFallbackDay: boolean
): string {
  const durationLabel = getDurationLabel(flight.departureTime, flight.arrivalTime)

  const base = [
    `${flight.airlineName || flight.airlineCode} ${flight.flightNumber}`,
    `${flight.departureAirportCode} → ${flight.arrivalAirportCode}`,
    durationLabel ? `Duration ${durationLabel}` : null,
    kind === 'departure'
      ? flight.departureTerminal
        ? `Terminal ${flight.departureTerminal}`
        : null
      : flight.arrivalTerminal
        ? `Terminal ${flight.arrivalTerminal}`
        : null,
    usedFallbackDay ? 'Placed on the nearest trip day.' : null,
    'Local time',
  ].filter(Boolean)

  return base.join(' · ')
}

export async function deleteTripFlight(input: {
  supabase: SupabaseClient
  tripId: string
  direction: FlightDirection
}): Promise<void> {
  const { error } = await input.supabase
    .from('trip_flights')
    .delete()
    .eq('trip_id', input.tripId)
    .eq('direction', input.direction)

  if (error) {
    throw new Error(error.message || 'Failed to delete flight.')
  }
}

export async function addSavedFlightToTripTimeline(input: {
  supabase: SupabaseClient
  tripId: string
  direction: FlightDirection
}): Promise<{ insertedCount: number; skippedCount: number }> {
  const [daysResult, flights] = await Promise.all([
    input.supabase
      .from('days')
      .select('id, date, day_number')
      .eq('trip_id', input.tripId)
      .order('day_number', { ascending: true })
      .returns<DayRow[]>(),
    listTripFlights(input.supabase, input.tripId),
  ])

  const days = daysResult.data || []
  if (!daysResult.data || daysResult.error || days.length === 0) {
    throw new Error('Trip days are required before adding flight items to the itinerary.')
  }

  const flight = flights.find((item) => item.direction === input.direction)
  if (!flight) {
    throw new Error('Saved flight not found for this direction.')
  }

  const departureDate = getDatePart(flight.departureTime)
  const arrivalDate = getDatePart(flight.arrivalTime)
  const departureTime = getTimePart(flight.departureTime)
  const arrivalTime = getTimePart(flight.arrivalTime)

  if (!departureDate || !arrivalDate) {
    throw new Error('Saved flight times were incomplete.')
  }

  const departureDay = resolveDay(days, departureDate, 'departure')
  const arrivalDay = resolveDay(days, arrivalDate, 'arrival')

  const candidateEvents = [
    departureDay && departureTime
      ? {
          day: departureDay,
          title: buildFlightTimelineTitle('departure', {
            city: flight.departureCity,
            airportName: flight.departureAirportName,
            airportCode: flight.departureAirportCode,
          }),
          activity_time: departureTime,
          note: buildFlightNote(flight, 'departure', departureDay.date !== departureDate),
        }
      : null,
    arrivalDay && arrivalTime
      ? {
          day: arrivalDay,
          title: buildFlightTimelineTitle('arrival', {
            city: flight.arrivalCity,
            airportName: flight.arrivalAirportName,
            airportCode: flight.arrivalAirportCode,
          }),
          activity_time: arrivalTime,
          note: buildFlightNote(flight, 'arrival', arrivalDay.date !== arrivalDate),
        }
      : null,
  ].filter((event): event is NonNullable<typeof event> => event !== null)

  if (candidateEvents.length === 0) {
    throw new Error('No trip day matched this flight timing.')
  }

  const targetDayIds = Array.from(new Set(candidateEvents.map((event) => event.day.id)))

  const [{ data: existingActivities }, { data: sortRows }] = await Promise.all([
    input.supabase
      .from('activities')
      .select('day_id, title, activity_time, notes')
      .in('day_id', targetDayIds),
    input.supabase
      .from('activities')
      .select('day_id, sort_order')
      .in('day_id', targetDayIds),
  ])

  const nextSortOrderByDay = new Map<string, number>()
  for (const day of days) {
    const maxSortOrder = (sortRows || [])
      .filter((row) => row.day_id === day.id)
      .reduce((max, row) => Math.max(max, row.sort_order || 0), 0)
    nextSortOrderByDay.set(day.id, maxSortOrder + 1)
  }

  const rowsToInsert = candidateEvents.flatMap((event) => {
    const duplicate = (existingActivities || []).some((row) =>
      row.day_id === event.day.id &&
      row.title === event.title &&
      row.activity_time === event.activity_time &&
      row.notes === event.note
    )

    if (duplicate) {
      return []
    }

    const sortOrder = nextSortOrderByDay.get(event.day.id) || 1
    nextSortOrderByDay.set(event.day.id, sortOrder + 1)

    return [{
      day_id: event.day.id,
      title: event.title,
      activity_time: event.activity_time,
      type: 'transport' as const,
      notes: event.note,
      status: 'planned' as const,
      sort_order: sortOrder,
      place_id: null,
    }]
  })

  if (rowsToInsert.length > 0) {
    const { error } = await input.supabase.from('activities').insert(rowsToInsert)
    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    insertedCount: rowsToInsert.length,
    skippedCount: candidateEvents.length - rowsToInsert.length,
  }
}

// Unified flight activity model


export async function saveUnifiedTripFlight(input: {
  supabase: SupabaseClient
  tripId: string
  flight: FlightActivity
}): Promise<FlightActivity> {
  // Ensure the activity is anchored to the departure day
  const depDate = input.flight.departure.datetime.slice(0, 10)
  // Find or create the day for the departure
  let dayId = input.flight.day_id
  if (!dayId) {
    const { data: dayRow, error: dayError } = await input.supabase
      .from('days')
      .select('id')
      .eq('trip_id', input.tripId)
      .eq('date', depDate)
      .single()
    if (dayRow) {
      dayId = dayRow.id
    } else {
      // Create the day if missing: must provide day_number
      // 1. Get max day_number for this trip
      const { data: maxDay, error: maxDayError } = await input.supabase
        .from('days')
        .select('day_number')
        .eq('trip_id', input.tripId)
        .order('day_number', { ascending: false })
        .limit(1)
        .single()
      if (maxDayError) {
        throw new Error(maxDayError?.message || 'Failed to get max day_number for trip')
      }
      const nextDayNumber = maxDay && typeof maxDay.day_number === 'number' ? maxDay.day_number + 1 : 1;
      // 2. Insert new day with day_number
      const { data: newDay, error: newDayError } = await input.supabase
        .from('days')
        .insert({ trip_id: input.tripId, date: depDate, day_number: nextDayNumber })
        .select('id')
        .single()
      if (newDay) {
        dayId = newDay.id
      } else {
        throw new Error(newDayError?.message || 'Failed to create day for flight')
      }
    }
  }
  const activity: FlightActivity = {
    ...input.flight,
    day_id: dayId,
    type: 'flight',
    created_at: input.flight.created_at || new Date().toISOString(),
  }
  // Upsert by trip, day, and flight number
  const { data, error } = await input.supabase
    .from('activities')
    .upsert(activity, { onConflict: 'trip_id,day_id,flightNumber' })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(error?.message || 'Failed to save flight activity')
  }
  return data as FlightActivity
}

export async function deleteUnifiedTripFlight(input: {
  supabase: SupabaseClient
  tripId: string
  id: string
}): Promise<void> {
  const { error } = await input.supabase
    .from('activities')
    .delete()
    .eq('trip_id', input.tripId)
    .eq('id', input.id)
    .eq('type', 'flight')
  if (error) {
    throw new Error(error.message || 'Failed to delete flight activity')
  }
}
