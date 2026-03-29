// Airport code to IANA timezone mapping (expand as needed)
const AIRPORT_TIMEZONE_MAP: Record<string, string> = {
  SIN: 'Asia/Singapore',
  HKG: 'Asia/Hong_Kong',
  // Add more as needed
};

function getAirportTimezone(airportCode: string, fallback: string = 'UTC'): string {
  if (!airportCode) return fallback;
  return AIRPORT_TIMEZONE_MAP[airportCode] || fallback;
}
import { v4 as uuidv4 } from 'uuid';
import { ActivityType } from '@/types/trip';
import type { SavedTripFlight } from '@/lib/flights/trip';
import { getLocalDateFromIsoDatetime } from '@/lib/utils/localDateFromIso';

/**
 * Map a flight search result to two activities: departure and arrival.
 * @param flight - The flight search result object
 * @param dayIdMap - Map of date (YYYY-MM-DD) to day_id in itinerary
 */
export function mapFlightToActivities(
  flight: SavedTripFlight,
  dayIdMap: Record<string, string>
) {
  const flightRef = uuidv4();

  // Defensive: require airport timezone fields (should be present from API or metadata)
  // Use correct IANA timezone for departure and arrival
  // Auto-correct timezones if missing or set to 'UTC'
  let depTz = flight.departureAirportTimezone;
  if (!depTz || depTz === 'UTC') {
    depTz = getAirportTimezone(flight.departureAirportCode, 'Asia/Singapore');
    console.warn('[FlightActivity][WARN] Auto-corrected departure timezone:', flight.departureAirportCode, '->', depTz);
  }
  let arrTz = flight.arrivalAirportTimezone;
  if (!arrTz || arrTz === 'UTC') {
    arrTz = getAirportTimezone(flight.arrivalAirportCode, 'Asia/Hong_Kong');
    console.warn('[FlightActivity][WARN] Auto-corrected arrival timezone:', flight.arrivalAirportCode, '->', arrTz);
  }

  // Normalize times to ISO if needed
  const depTimeIso = flight.departureTime?.replace(' ', 'T') ?? '';
  const arrTimeIso = flight.arrivalTime?.replace(' ', 'T') ?? '';
  // Use local date at departure airport for departure activity
  const depLocalDate = getLocalDateFromIsoDatetime(depTimeIso, depTz);
  // Use local date at arrival airport for arrival activity (ensure correct timezone)
  const arrLocalDate = getLocalDateFromIsoDatetime(arrTimeIso, arrTz);
  // Enhanced debug logs for date mapping
  console.log('[FlightActivity][DEBUG]', {
    departureTime: flight.departureTime,
    departureAirportTimezone: depTz,
    depTimeIso,
    depLocalDate,
    arrivalTime: flight.arrivalTime,
    arrivalAirportTimezone: arrTz,
    arrTimeIso,
    arrLocalDate,
    dayIdMapKeys: Object.keys(dayIdMap),
    flight,
  });
  const depDayId = dayIdMap[depLocalDate];
  const arrDayId = dayIdMap[arrLocalDate];

  if (!depDayId || !arrDayId) {
    console.warn('[FlightActivity][ERROR] Missing dayId for departure or arrival:', {
      depLocalDate, arrLocalDate, depDayId, arrDayId, dayIdMapKeys: Object.keys(dayIdMap), flight,
    });
    return [
      depDayId && flight.departureTime ? {
        id: uuidv4(),
        day_id: depDayId,
        type: 'transport' as ActivityType,
        title: `Flight ${flight.flightNumber} Departure`,
        activity_time: flight.departureTime,
        notes: `${flight.airlineName || flight.airlineCode} ${flight.flightNumber} from ${flight.departureAirportCode} to ${flight.arrivalAirportCode}`,
        sort_order: 0,
        place_id: null,
        created_at: new Date().toISOString(),
        metadata: {
          ...flight,
          segment: 'departure',
        },
        flight_ref: flightRef,
      } : null,
      arrDayId && flight.arrivalTime ? {
        id: uuidv4(),
        day_id: arrDayId,
        type: 'transport' as ActivityType,
        title: `Flight ${flight.flightNumber} Arrival`,
        activity_time: flight.arrivalTime,
        notes: `${flight.airlineName || flight.airlineCode} ${flight.flightNumber} arrives at ${flight.arrivalAirportCode}`,
        sort_order: 0,
        place_id: null,
        created_at: new Date().toISOString(),
        metadata: {
          ...flight,
          segment: 'arrival',
        },
        flight_ref: flightRef,
      } : null,
    ].filter(Boolean);
  }

  const departureActivity = {
    id: uuidv4(),
    day_id: depDayId,
    type: 'transport' as ActivityType,
    title: `Flight ${flight.flightNumber} Departure`,
    activity_time: flight.departureTime,
    notes: `${flight.airlineName || flight.airlineCode} ${flight.flightNumber} from ${flight.departureAirportCode} to ${flight.arrivalAirportCode}`,
    sort_order: 0,
    place_id: null,
    created_at: new Date().toISOString(),
    metadata: {
      ...flight,
      segment: 'departure',
    },
    flight_ref: flightRef,
  }

  const arrivalActivity = {
    id: uuidv4(),
    day_id: arrDayId,
    type: 'transport' as ActivityType,
    title: `Flight ${flight.flightNumber} Arrival`,
    activity_time: flight.arrivalTime,
    notes: `${flight.airlineName || flight.airlineCode} ${flight.flightNumber} arrives at ${flight.arrivalAirportCode}`,
    sort_order: 0,
    place_id: null,
    created_at: new Date().toISOString(),
    metadata: {
      ...flight,
      segment: 'arrival',
    },
    flight_ref: flightRef,
  }

  return [departureActivity, arrivalActivity];
}
