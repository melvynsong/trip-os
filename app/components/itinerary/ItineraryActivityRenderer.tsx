import ActivityCard from '@/app/components/itinerary/ActivityCard'
import FlightActivityCard from './FlightActivityCard'
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
    return (
      <FlightActivityCard
        tripId={tripId}
        dayId={dayId}
        activity={item.activity}
        role={item.role}
        meta={item.meta}
      />
    )
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
