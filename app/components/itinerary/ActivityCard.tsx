import { Activity as ActivityType } from '@/types/trip'
import { getEmoji } from '@/lib/utils/getEmoji'

type ActivityCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order'
>

type ActivityCardProps = {
  activity: ActivityCardActivity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">
          {getEmoji(activity.type)} {activity.title}
        </div>
        <div className="text-sm text-gray-500">
          {activity.activity_time || 'No time'}
        </div>
      </div>

      <div className="mt-1 text-sm text-gray-500 capitalize">{activity.type}</div>

      {activity.notes ? (
        <div className="mt-2 text-sm text-gray-700">{activity.notes}</div>
      ) : null}
    </div>
  )
}
