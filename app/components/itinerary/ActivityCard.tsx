
import React from 'react';
import Link from 'next/link'
import { Activity as ActivityType } from '@/types/trip'
import { getEmoji } from '@/lib/utils/getEmoji'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import { buttonClass } from '@/app/components/ui/Button'
import { ActionRow } from '@/app/components/shared/ActionRow'
import Card from '@/app/components/ui/Card'
import { Typography } from '@/app/components/design-system/Typography'

type ActivityCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
> & {
  places: { id: string; name: string } | null
}

type ActivityCardProps = {
  tripId: string
  activity: ActivityCardActivity
  onDelete: (activityId: string) => void
}

export default function ActivityCard({ tripId, activity, onDelete }: ActivityCardProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[UI_ACTION][ACTIVITY_CARD_RENDERED]', {
        tripId,
        dayId: activity.day_id,
        activityId: activity.id,
        activityTitle: activity.title,
        timestamp: new Date().toISOString(),
        pageSource: typeof window !== 'undefined' && window.location.pathname.includes('today') ? 'today' : 'itinerary',
      });
    }
  }, [tripId, activity]);
  return (
    <Card key={activity.id}>
      <div className="flex items-center justify-between gap-3">
        <Typography variant="cardTitle" className="min-w-0">
          {getEmoji(activity.type, { title: activity.title, notes: activity.notes })} {activity.title}
        </Typography>
        <span className="text-xs font-medium text-slate-500">
          {activity.activity_time || 'No time'}
        </span>
      </div>

      <Typography variant="meta" className="mt-1 capitalize">
        {activity.type}
      </Typography>

      {activity.places && (
        <div className="mt-2 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
          📍 {activity.places.name}
        </div>
      )}

      {activity.notes ? (
        <Typography variant="helper" className="mt-3 leading-7 text-slate-600">
          {activity.notes}
        </Typography>
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
        {/* Only Write Story and Edit remain. Remove button hidden for itinerary page. */}
        <Link
          href={`/trips/${tripId}/itinerary/${activity.day_id}/activities/${activity.id}/edit`}
          className={buttonClass({ size: 'sm', variant: 'ghost', className: 'h-8 rounded-full text-xs text-slate-700 hover:bg-sky-50/70' })}
          onClick={() => {
            if (typeof window !== 'undefined') {
              console.log('[UI_ACTION][EDIT_ACTIVITY_CLICKED]', {
                tripId,
                dayId: activity.day_id,
                activityId: activity.id,
                activityTitle: activity.title,
                timestamp: new Date().toISOString(),
                pageSource: typeof window !== 'undefined' && window.location.pathname.includes('today') ? 'today' : 'itinerary',
              });
            }
          }}
        >
          Edit
        </Link>
        <ActionRow isActing={false} onDelete={() => {}} hideRemove={true} />
      </div>
    </Card>
  )
}
