import TimeOfDaySection from '@/app/components/itinerary/TimeOfDaySection'
import ItineraryActivityRenderer from '@/app/components/itinerary/ItineraryActivityRenderer'
import type { TodayItem } from '@/app/components/today/TimelineItemCard'

export type TodayTimelineSection = {
  key: string
  label: string
  items: TodayItem[]
}

export function sectionTodayItemsByTime(items: TodayItem[]): TodayTimelineSection[] {
  const periods = [
    { key: 'morning', label: '🌅 Morning', start: 0, end: 12 },
    { key: 'afternoon', label: '☀️ Afternoon', start: 12, end: 17 },
    { key: 'evening', label: '🌙 Evening', start: 17, end: 24 },
    { key: 'unscheduled', label: '📋 Unscheduled', start: null, end: null },
  ]
  const groups: Record<string, TodayItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    unscheduled: [],
  }
  for (const item of items) {
    if (!item.activity_time) {
      groups.unscheduled.push(item)
      continue
    }
    const [h] = item.activity_time.split(':').map(Number)
    if (h < 12) groups.morning.push(item)
    else if (h < 17) groups.afternoon.push(item)
    else groups.evening.push(item)
  }
  return periods.map(({ key, label }) => ({ key, label, items: groups[key] }))
}
