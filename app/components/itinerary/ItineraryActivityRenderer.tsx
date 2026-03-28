import ActivityCard from '@/app/components/itinerary/ActivityCard'
import FlightActivityBlock from '@/app/components/itinerary/FlightActivityBlock'
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
  if (item.kind === 'flight') {
    return <FlightActivityBlock tripId={tripId} dayId={dayId} group={item.group} />
  }

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
