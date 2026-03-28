// Shared timeline transformation for itinerary and story pages
import type { ItineraryActivity, ItineraryTimelineItem, TimeOfDaySection } from '../trips/itinerary-transform'
import { transformItineraryDayActivities } from '../trips/itinerary-transform'

// Accepts all activities for a trip, returns grouped timeline items and sections
export function transformActivitiesForTimeline(activities: ItineraryActivity[]): {
  orderedItems: ItineraryTimelineItem[]
  sections: TimeOfDaySection[]
} {
  return transformItineraryDayActivities(activities)
}
