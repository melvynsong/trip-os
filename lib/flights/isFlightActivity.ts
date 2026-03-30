// Shared flight activity detection helper
// Used by TimelineItemCard, FlightJourneyCard, and any flight-related UI

export function isFlightActivity(activity: any): boolean {
  if (!activity) return false;
  if (activity.type && [
    'flight', 'flight_departure', 'flight_arrival', 'flight_card', 'unified_flight', 'transport'
  ].includes(activity.type)) return true;
  const meta = activity.metadata || activity._meta || {};
  return !!(
    meta.flightNumber || meta.airline || meta.departure || meta.arrival
  );
}
