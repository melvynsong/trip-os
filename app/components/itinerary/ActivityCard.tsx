import Link from 'next/link'
import { Activity as ActivityType } from '@/types/trip'
import { getEmoji } from '@/lib/utils/getEmoji'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'

type ActivityCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
> & {
  places: { id: string; name: string } | null
}

type ActivityCardProps = {
  tripId: string
  activity: ActivityCardActivity
  canMoveUp: boolean
  canMoveDown: boolean
  moveActivityAction: (formData: FormData) => Promise<void>
}

export default function ActivityCard({
  tripId,
  activity,
  canMoveUp,
  canMoveDown,
  moveActivityAction,
}: ActivityCardProps) {
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

      {activity.places && (
        <div className="mt-1 text-xs text-blue-600">📍 {activity.places.name}</div>
      )}

      {activity.notes ? (
        <div className="mt-2 text-sm text-gray-700">{activity.notes}</div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StoryGenerationSheet
          tripId={tripId}
          scope="place"
          dayId={activity.day_id}
          activityId={activity.id}
          title="Write Activity Story"
          triggerLabel="Write Story"
          triggerClassName="rounded-lg border px-2 py-1 text-xs"
        />
        <form action={moveActivityAction}>
          <input type="hidden" name="day_id" value={activity.day_id} />
          <input type="hidden" name="activity_id" value={activity.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={!canMoveUp}
            className="rounded-lg border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑ Up
          </button>
        </form>

        <form action={moveActivityAction}>
          <input type="hidden" name="day_id" value={activity.day_id} />
          <input type="hidden" name="activity_id" value={activity.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={!canMoveDown}
            className="rounded-lg border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓ Down
          </button>
        </form>

        <Link
          href={`/trips/${tripId}/itinerary/${activity.day_id}/activities/${activity.id}/edit`}
          className="text-sm underline"
        >
          Edit
        </Link>
      </div>
    </div>
  )
}
