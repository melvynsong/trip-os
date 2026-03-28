import ItineraryActivityRenderer from '@/app/components/itinerary/ItineraryActivityRenderer'
import type { ItineraryTimelineItem } from '@/lib/trips/itinerary-transform'

export function renderStoryTimelineItem({
  tripId,
  dayId,
  item,
}: {
  tripId: string
  dayId: string
  item: ItineraryTimelineItem
}) {
  // For now, we assume canMoveUp/Down and moveActivityAction are not needed in story view
  return (
    <ItineraryActivityRenderer
      tripId={tripId}
      dayId={dayId}
      item={item}
      canMoveUp={false}
      canMoveDown={false}
      moveActivityAction={async () => {}}
    />
  )
}
