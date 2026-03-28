import { v4 as uuidv4 } from 'uuid';
import { ActivityType } from '@/types/trip';

/**
 * Map a flight search result to two activities: departure and arrival.
 * @param flight - The flight search result object
 * @param dayIdMap - Map of date (YYYY-MM-DD) to day_id in itinerary
 */
export function mapFlightToActivities(flight, dayIdMap) {
  const flightRef = uuidv4();
  const depDayId = dayIdMap[flight.departureDate];
  const arrDayId = dayIdMap[flight.arrivalDate];

  const departureActivity = {
    id: uuidv4(),
    day_id: depDayId,
    type: 'flight_departure' as ActivityType,
    title: `Flight ${flight.flightNumber} Departure`,
    activity_time: flight.departureTime,
    notes: `${flight.airline} ${flight.flightNumber} from ${flight.departureAirportCode} to ${flight.arrivalAirportCode}`,
    sort_order: 0,
    place_id: null,
    created_at: new Date().toISOString(),
    metadata: {
      ...flight,
      segment: 'departure',
    },
    flight_ref: flightRef,
  };

  const arrivalActivity = {
    id: uuidv4(),
    day_id: arrDayId,
    type: 'flight_arrival' as ActivityType,
    title: `Flight ${flight.flightNumber} Arrival`,
    activity_time: flight.arrivalTime,
    notes: `${flight.airline} ${flight.flightNumber} arrives at ${flight.arrivalAirportCode}`,
    sort_order: 0,
    place_id: null,
    created_at: new Date().toISOString(),
    metadata: {
      ...flight,
      segment: 'arrival',
    },
    flight_ref: flightRef,
  };

  return [departureActivity, arrivalActivity];
}
