'use client'

import TimelineItemCard, { type TodayItem } from '@/app/components/today/TimelineItemCard'
import TimeOfDaySection from '@/app/components/itinerary/TimeOfDaySection'
import ItineraryActivityRenderer from '@/app/components/itinerary/ItineraryActivityRenderer'
import { sectionTodayItemsByTime } from '@/app/components/today/sectionTodayItemsByTime'

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'unscheduled'


type DayTimelineProps = {
  tripId: string
  items: TodayItem[]
  actingIds: Set<string>
  onToggleDone: (item: TodayItem) => void
  onDelete: (item: TodayItem) => void
  onMoveUp: (item: TodayItem) => void
  onMoveDown: (item: TodayItem) => void
}

export default function DayTimeline({
  tripId,
  items,
  actingIds,
  onToggleDone,
  onDelete,
  onMoveUp,
  onMoveDown,
}: DayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
        <div className="text-3xl">📭</div>
        <div className="mt-2 font-medium text-slate-800">No activities yet</div>
        <div className="mt-1 text-sm">Add your first item below</div>
      </div>
    )
  }

  // Section items by time of day using shared logic
  const sections = sectionTodayItemsByTime(items)
  // For up/down we need the global index across the full ordered list
  const allSorted = [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    if (a.activity_time && b.activity_time) return a.activity_time < b.activity_time ? -1 : 1
    if (a.activity_time) return -1
    if (b.activity_time) return 1
    return 0
  })

  return (
    <div className="space-y-6">
      {sections.map((section) =>
        section.items.length === 0 ? null : (
          <TimeOfDaySection key={section.key} label={section.label}>
            {section.items.map((item) => {
              const globalIdx = allSorted.findIndex((i) => i.id === item.id)
              return (
                <ItineraryActivityRenderer
                  key={item.id}
                  tripId={tripId}
                  dayId={item.day_id}
                  item={{ kind: 'activity', activity: item }}
                  canMoveUp={globalIdx > 0}
                  canMoveDown={globalIdx < allSorted.length - 1}
                  moveActivityAction={() => {}}
                />
              )
            })}
          </TimeOfDaySection>
        )
      )}
    </div>
  )
}
