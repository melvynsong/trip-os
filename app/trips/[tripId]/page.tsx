import { redirect } from 'next/navigation';
export default async function TripDashboardPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  redirect(`/trips/${tripId}/itinerary`);
}
