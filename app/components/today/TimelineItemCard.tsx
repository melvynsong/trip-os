'use client'
import React from 'react';


import { getEmoji } from '@/lib/utils/getEmoji'
import { Activity as ActivityType } from '@/types/trip'
import { buttonClass } from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'
import { Typography } from '@/app/components/design-system/Typography'
import FlightJourneyCard from '@/app/components/itinerary/FlightJourneyCard'
import { getFlightDisplayModel } from '@/lib/flights/flightDisplayModel'
import { isFlightActivity } from '@/lib/flights/isFlightActivity'
import { ActionRow } from '@/app/components/shared/ActionRow'

export type TodayItem = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'status' | 'sort_order'
> & {
  metadata?: any;
};

type TimelineItemCardProps = {
  tripId: string
  item: TodayItem
  isActing: boolean
  onDelete: (item: TodayItem) => void
}

function formatTime(t: string) {
  // Always return 24-hour format (HH:mm)
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}


export default function TimelineItemCard({ tripId, item, isActing, onDelete }: TimelineItemCardProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[UI_ACTION][ACTIVITY_CARD_RENDERED]', {
        tripId,
        dayId: item.day_id,
        activityId: item.id,
        activityTitle: item.title,
        timestamp: new Date().toISOString(),
        pageSource: typeof window !== 'undefined' && window.location.pathname.includes('today') ? 'today' : 'itinerary',
      });
    }
  }, [tripId, item]);

  // If this is a flight, use the shared rich flight card
  if (isFlightActivity(item)) {
    const flightModel = getFlightDisplayModel(item as any) || item;
    return (
      <div>
        <FlightJourneyCard
          activity={flightModel}
          onDelete={isActing ? undefined : () => onDelete(item)}
        />
      </div>
    );
  }

  // Non-flight: use existing card with shared ActionRow
  const isDone = item.status === 'done';
  return (
    <Card className={`flex gap-3 ${isDone ? 'opacity-70' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Typography variant="cardTitle" className={isDone ? 'line-through text-slate-400' : ''}>
            {getEmoji(item.type, { title: item.title, notes: item.notes })} {item.title}
          </Typography>
          {item.activity_time && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs tabular-nums font-medium text-slate-600">
              {formatTime(item.activity_time)}
            </span>
          )}
        </div>

        <Typography variant="meta" className="mt-0.5 capitalize">
          {item.type}
        </Typography>

        {item.notes && !isDone && (
          <Typography variant="helper" className="mt-1.5 leading-7 text-slate-600">
            {item.notes}
          </Typography>
        )}

        <ActionRow
          isActing={isActing}
          onDelete={() => {
            if (typeof window !== 'undefined') {
              console.log('[UI_ACTION][DELETE_ACTIVITY_CLICKED]', {
                tripId,
                dayId: item.day_id,
                activityId: item.id,
                activityTitle: item.title,
                timestamp: new Date().toISOString(),
                pageSource: typeof window !== 'undefined' && window.location.pathname.includes('today') ? 'today' : 'itinerary',
              });
            }
            onDelete(item);
          }}
        />
      </div>
    </Card>
  );
}
