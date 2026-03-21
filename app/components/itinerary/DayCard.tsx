import Link from 'next/link'
import ActivityCard from '@/app/components/itinerary/ActivityCard'
import { Day as DayType, Activity as ActivityType } from '@/types/trip'

type DayCardDay = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type DayCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order'
>

type DayCardProps = {
  tripId: string
  day: DayCardDay
  activities: DayCardActivity[]
}

export default function DayCard({ tripId, day, activities }: DayCardProps) {
  return (
    <div key={day.id} className="rounded-2xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-lg">
            Day {day.day_number}
            {day.title ? ` — ${day.title}` : ''}
          </div>
          <div className="text-sm text-gray-500">{day.date}</div>
        </div>

        <Link
          href={`/trips/${tripId}/itinerary/${day.id}/new`}
          className="rounded-lg border px-3 py-1 text-sm"
        >
          + Add Activity
        </Link>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">No activities yet</div>
      )}
    </div>
  )
}
