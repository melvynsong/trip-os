import { redirect } from 'next/navigation';

export default async function TripDashboardPage({ params }: { params: { tripId?: string } | Promise<{ tripId?: string }> }) {
  // Step 1: Await params if it's a Promise
  const resolvedParams = typeof params.then === 'function' ? await params : params;
  console.log('[TripDashboardPage][SERVER][DEBUG] resolvedParams:', resolvedParams);

  // Step 2: Guard for missing or malformed params
  let tripId: string | undefined = undefined;
  if (resolvedParams && typeof resolvedParams === 'object' && 'tripId' in resolvedParams) {
    tripId = resolvedParams.tripId;
  }

  // Step 3: Fail gracefully and log details
  if (!tripId || tripId === 'undefined' || typeof tripId !== 'string') {
    console.error('[TripDashboardPage][SERVER][ERROR] tripId missing or invalid:', tripId, 'resolvedParams:', resolvedParams);
    return <div style={{ color: 'red', padding: 32 }}>Error: Trip ID is missing or invalid. (params: {JSON.stringify(resolvedParams)})</div>;
  }

  redirect(`/trips/${tripId}/itinerary`);
}
