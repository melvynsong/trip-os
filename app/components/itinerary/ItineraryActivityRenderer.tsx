import ActivityCard from '@/app/components/itinerary/ActivityCard'
import FlightJourneyCard from '@/app/components/itinerary/FlightJourneyCard'
import { getFlightDisplayModel } from '@/lib/flights/flightDisplayModel'
import type { ItineraryTimelineItem } from '@/lib/trips/itinerary-transform'

type ItineraryActivityRendererProps = {
  tripId: string
  dayId: string
  item: ItineraryTimelineItem
  canMoveUp: boolean
  canMoveDown: boolean
  moveActivityAction: (formData: FormData) => Promise<void>
}

export default function ItineraryActivityRenderer({
  tripId,
  dayId,
  item,
  canMoveUp,
  canMoveDown,
  moveActivityAction,
}: ItineraryActivityRendererProps) {
  if (item.kind === 'flight_card') {
    // Use normalized flight display model
    const flightModel = getFlightDisplayModel(item.activity) || item.activity;
    // Debug log
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[FlightCard][Renderer] raw:', item.activity, 'model:', flightModel);
    }
    return (
      <FlightJourneyCard activity={flightModel} />
    );
  }

  if (item.kind === 'activity') {
    return (
      <ActivityCard
        tripId={tripId}
        activity={item.activity}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        moveActivityAction={moveActivityAction}
      />
    )
  }

  return null
}
