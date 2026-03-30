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

// New unified FlightActivity type
export interface FlightActivity {
  id: string;
  day_id: string;
  type: 'flight';
  airline: string;
  flightNumber: string;
  carrierCode?: string;
  departure: {
    airportCode: string;
    airportName: string;
    city: string;
    terminal?: string;
    datetime: string; // ISO, local time
  };
  arrival: {
    airportCode: string;
    airportName: string;
    city: string;
    terminal?: string;
    datetime: string; // ISO, local time
  };
  duration?: string;
  aircraft?: string;
  notes?: string;
  rawMetadata?: any;
  created_at: string;
}


/**
 * Map a flight search result to a single unified FlightActivity.
 * @param flight - The flight search result object
 * @param dayIdMap - Map of date (YYYY-MM-DD) to day_id in itinerary
 */
export function mapFlightToUnifiedActivity(
  flight: SavedTripFlight,
  dayIdMap: Record<string, string>
): FlightActivity | null {
  // Use correct IANA timezone for departure and arrival
  let depTz = flight.departureAirportTimezone;
  if (!depTz || depTz === 'UTC') {
    depTz = getAirportTimezone(flight.departureAirportCode, 'Asia/Singapore');
  }
  let arrTz = flight.arrivalAirportTimezone;
  if (!arrTz || arrTz === 'UTC') {
    arrTz = getAirportTimezone(flight.arrivalAirportCode, 'Asia/Hong_Kong');
  }

  // Normalize times to ISO if needed
  const depTimeIso = flight.departureTime?.replace(' ', 'T') ?? '';
  const arrTimeIso = flight.arrivalTime?.replace(' ', 'T') ?? '';
  // Use local date at departure airport for anchoring the activity
  const depLocalDate = getLocalDateFromIsoDatetime(depTimeIso, depTz);
  const depDayId = dayIdMap[depLocalDate];
  if (!depDayId) {
    console.warn('[FlightActivity][ERROR] Missing dayId for departure:', { depLocalDate, depDayId, dayIdMapKeys: Object.keys(dayIdMap), flight });
    return null;
  }

  return {
    id: uuidv4(),
    day_id: depDayId,
    type: 'flight',
    airline: flight.airlineName || flight.airlineCode,
    flightNumber: flight.flightNumber,
    carrierCode: flight.airlineCode,
    departure: {
      airportCode: flight.departureAirportCode,
      airportName: flight.departureAirportName || '',
      city: flight.departureCity || '',
      terminal: flight.departureTerminal || undefined,
      datetime: depTimeIso,
    },
    arrival: {
      airportCode: flight.arrivalAirportCode,
      airportName: flight.arrivalAirportName || '',
      city: flight.arrivalCity || '',
      terminal: flight.arrivalTerminal || undefined,
      datetime: arrTimeIso,
    },
    duration: flight.duration || undefined,
    aircraft: flight.aircraftModel || undefined,
    notes: flight.status || undefined,
    rawMetadata: flight.rawResponseJson || undefined,
    created_at: new Date().toISOString(),
  };
}
