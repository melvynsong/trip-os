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
  // Render story timeline item without move controls or actions
  return (
    <ItineraryActivityRenderer
      tripId={tripId}
      dayId={dayId}
      item={item}
      onDelete={() => {}}
    />
  )
}
