import ActivityCard from '@/app/components/itinerary/ActivityCard'
import FlightJourneyCard from '@/app/components/itinerary/FlightJourneyCard'
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
    // Render unified flight journey card
    return (
      <FlightJourneyCard activity={item.activity} />
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
