import { redirect } from 'next/navigation';
export default async function TripDashboardPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[TripDashboardPage][DEBUG] params:', params, 'tripId:', tripId);
  }
  if (!tripId || tripId === 'undefined') {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[TripDashboardPage][ERROR] tripId missing or undefined:', tripId);
    }
    // Fail gracefully instead of redirecting to /trips/undefined/itinerary
    return <div style={{ color: 'red', padding: 32 }}>Error: Trip ID is missing or invalid.</div>;
  }
  redirect(`/trips/${tripId}/itinerary`);
}
