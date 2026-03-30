import { redirect } from 'next/navigation';

export default async function TripDashboardPage({ params }: { params: { tripId?: string } }) {
  // Step 1: Robust server-side debug logging
  console.log('[TripDashboardPage][SERVER][DEBUG] params:', params);

  // Step 2: Guard for missing or malformed params
  let tripId: string | undefined = undefined;
  if (params && typeof params === 'object' && 'tripId' in params) {
    tripId = params.tripId;
  }

  // Step 3: Fail gracefully and log details
  if (!tripId || tripId === 'undefined' || typeof tripId !== 'string') {
    console.error('[TripDashboardPage][SERVER][ERROR] tripId missing or invalid:', tripId, 'params:', params);
    return <div style={{ color: 'red', padding: 32 }}>Error: Trip ID is missing or invalid. (params: {JSON.stringify(params)})</div>;
  }

  redirect(`/trips/${tripId}/itinerary`);
}
