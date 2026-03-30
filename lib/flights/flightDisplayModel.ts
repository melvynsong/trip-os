// Helper to extract and normalize flight display data from a saved activity row
// Handles backward compatibility and missing fields gracefully
import type { Activity } from '@/types/trip';

export function getFlightDisplayModel(activity: Activity) {
  if (!activity || activity.type !== 'transport' || !activity.metadata) return null;
  const meta = activity.metadata || {};
  // Fallbacks for backward compatibility
  const dep = meta.departure || {};
  const arr = meta.arrival || {};
  return {
    airline: meta.airline || '',
    flightNumber: meta.flightNumber || '',
    carrierCode: meta.carrierCode || '',
    departure: {
      airportCode: dep.airportCode || '',
      airportName: dep.airportName || '',
      city: dep.city || '',
      terminal: dep.terminal || '',
      datetime: dep.datetime || '',
    },
    arrival: {
      airportCode: arr.airportCode || '',
      airportName: arr.airportName || '',
      city: arr.city || '',
      terminal: arr.terminal || '',
      datetime: arr.datetime || '',
    },
    duration: meta.duration || '',
    aircraft: meta.aircraft || '',
    notes: activity.notes || meta.status || '',
    rawMetadata: meta.rawMetadata,
    created_at: activity.created_at,
    id: activity.id,
    day_id: activity.day_id,
    type: 'flight',
    // For diagnostics
    _raw: activity,
    _meta: meta,
  };
}
