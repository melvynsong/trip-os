import { redirect } from 'next/navigation';

export default async function TripDashboardPage({ params }: { params: Promise<{ tripId?: string }> }) {
  // Always await params (Next.js app directory convention)
  const resolvedParams = await params;
  console.log('[TripDashboardPage][SERVER][DEBUG] resolvedParams:', resolvedParams);

  // Guard for missing or malformed params
  const tripId = resolvedParams?.tripId;

  // Fail gracefully and log details
  if (!tripId || tripId === 'undefined' || typeof tripId !== 'string') {
    console.error('[TripDashboardPage][SERVER][ERROR] tripId missing or invalid:', tripId, 'resolvedParams:', resolvedParams);
    return <div style={{ color: 'red', padding: 32 }}>Error: Trip ID is missing or invalid. (params: {JSON.stringify(resolvedParams)})</div>;
  }

  redirect(`/trips/${tripId}/itinerary`);
}
