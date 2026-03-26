import Link from 'next/link'
import { Activity as ActivityType } from '@/types/trip'
import { getEmoji } from '@/lib/utils/getEmoji'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import { buttonClass } from '@/app/components/ui/Button'

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
    <div
      key={activity.id}
      className="rounded-[1.4rem] border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:bg-sky-50/60"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-base font-semibold text-slate-900 sm:text-[1.1rem]">
          {getEmoji(activity.type)} {activity.title}
        </div>
        <div className="shrink-0 text-sm font-medium text-slate-500">
          {activity.activity_time || 'No time'}
        </div>
      </div>

      <div className="mt-1 text-sm text-slate-500 capitalize">{activity.type}</div>

      {activity.places && (
        <div className="mt-2 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
          📍 {activity.places.name}
        </div>
      )}

      {activity.notes ? (
        <div className="mt-3 text-sm leading-7 text-slate-600">{activity.notes}</div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StoryGenerationSheet
          tripId={tripId}
          scope="place"
          dayId={activity.day_id}
          activityId={activity.id}
          title="Write Activity Story"
          triggerLabel="Write Story"
          triggerClassName={buttonClass({ size: 'sm', className: 'h-8 rounded-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-sky-50/70' })}
        />
        <form action={moveActivityAction}>
          <input type="hidden" name="day_id" value={activity.day_id} />
          <input type="hidden" name="activity_id" value={activity.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={!canMoveUp}
            className={buttonClass({ size: 'sm', className: 'h-8 rounded-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-sky-50/70' })}
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
            className={buttonClass({ size: 'sm', className: 'h-8 rounded-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-sky-50/70' })}
          >
            ↓ Down
          </button>
        </form>

        <Link
          href={`/trips/${tripId}/itinerary/${activity.day_id}/activities/${activity.id}/edit`}
          className={buttonClass({ size: 'sm', variant: 'ghost', className: 'h-8 rounded-full text-xs text-slate-700 hover:bg-sky-50/70' })}
        >
          Edit
        </Link>
      </div>
    </div>
  )
}
