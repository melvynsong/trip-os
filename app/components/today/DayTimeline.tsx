'use client'

import TimelineItemCard, { type TodayItem } from '@/app/components/today/TimelineItemCard'

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'unscheduled'

const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌙 Evening',
  unscheduled: '📋 Unscheduled',
}

function getTimePeriod(time: string | null): TimePeriod {
  if (!time) return 'unscheduled'
  const [h] = time.split(':').map(Number)
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening', 'unscheduled']

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

  // Group by time period
  const groups = new Map<TimePeriod, TodayItem[]>()
  for (const period of PERIOD_ORDER) {
    groups.set(period, [])
  }
  for (const item of items) {
    const period = getTimePeriod(item.activity_time)
    groups.get(period)!.push(item)
  }

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
      {PERIOD_ORDER.map((period) => {
        const periodItems = groups.get(period)!
        if (periodItems.length === 0) return null

        return (
          <div key={period}>
            <div className="mb-2 text-sm font-semibold text-slate-500">
              {PERIOD_LABELS[period]}
            </div>
            <div className="space-y-2">
              {periodItems.map((item) => {
                const globalIdx = allSorted.findIndex((i) => i.id === item.id)
                return (
                  <TimelineItemCard
                    key={item.id}
                    tripId={tripId}
                    item={item}
                    canMoveUp={globalIdx > 0}
                    canMoveDown={globalIdx < allSorted.length - 1}
                    isActing={actingIds.has(item.id)}
                    onToggleDone={onToggleDone}
                    onDelete={onDelete}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
