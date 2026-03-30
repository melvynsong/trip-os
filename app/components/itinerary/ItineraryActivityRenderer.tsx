"use client";
import ActivityCard from '@/app/components/itinerary/ActivityCard';
import FlightJourneyCard from '@/app/components/itinerary/FlightJourneyCard';
import { getFlightDisplayModel } from '@/lib/flights/flightDisplayModel';
import type { ItineraryTimelineItem } from '@/lib/trips/itinerary-transform';

function isFlightActivity(activity: any): boolean {
  if (!activity) return false;
  if (activity.type && [
    'flight', 'flight_departure', 'flight_arrival', 'flight_card', 'unified_flight'
  ].includes(activity.type)) return true;
  const meta = activity.metadata || activity._meta || {};
  return !!(
    meta.flightNumber || meta.airline || meta.departure || meta.arrival
  );
}

type ItineraryActivityRendererProps = {
  tripId: string;
  dayId: string;
  item: ItineraryTimelineItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  moveActivityAction: (formData: FormData) => Promise<void>;
};

export default function ItineraryActivityRenderer({
  tripId,
  dayId,
  item,
  canMoveUp,
  canMoveDown,
  moveActivityAction,
}: ItineraryActivityRendererProps) {
  const activity = item.activity;
  const isFlight = isFlightActivity(activity);
  let chosenRenderer = 'generic';
  let flightModel = null;
  if (isFlight) {
    flightModel = getFlightDisplayModel(activity) || activity;
    chosenRenderer = 'rich-flight';
  }
  // Focused debug logs
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[ItineraryRenderer][DEBUG]', {
      id: activity?.id,
      type: activity?.type,
      isFlight,
      chosenRenderer,
      metadataKeys: activity?.metadata ? Object.keys(activity.metadata) : [],
      normalizedModel: flightModel,
    });
  }

  // Handler for deleting a flight activity
  const handleDeleteFlight = async (id: string) => {
    if (!window.confirm('Delete this flight from your itinerary?')) return;
    try {
      // Optimistically remove from UI (parent should refetch or update state)
      const resp = await fetch(`/api/trips/${tripId}/itinerary/${dayId}/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!resp.ok) {
        const d = await resp.json();
        alert(d.error || 'Failed to delete flight.');
        return;
      }
      // Optionally: trigger a refetch or state update here if needed
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete flight.');
    }
  };

  if (isFlight) {
    return <FlightJourneyCard activity={flightModel} onDelete={handleDeleteFlight} />;
  }
  return (
    <ActivityCard
      tripId={tripId}
      activity={activity}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      moveActivityAction={moveActivityAction}
    />
  );
}
