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
  const depTz = flight.departureAirportTimezone || 'UTC';
  const arrTz = flight.arrivalAirportTimezone || 'UTC';

  // Use local date at departure airport for departure activity
  const depLocalDate = getLocalDateFromIsoDatetime(flight.departureTime, depTz);
  const arrLocalDate = getLocalDateFromIsoDatetime(flight.arrivalTime, arrTz);
  // Debug logs for date mapping
  console.log('depLocalDate:', depLocalDate, 'arrLocalDate:', arrLocalDate, 'dayIdMap keys:', Object.keys(dayIdMap));
  const depDayId = dayIdMap[depLocalDate];
  const arrDayId = dayIdMap[arrLocalDate];

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
