import Link from 'next/link'
import ItineraryActivityRenderer from '@/app/components/itinerary/ItineraryActivityRenderer'
import TimeOfDaySection from '@/app/components/itinerary/TimeOfDaySection'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'
import { formatDayForWhatsApp } from '@/lib/share/whatsapp'
import { transformActivitiesForTimeline } from '@/lib/trips/timeline-shared'
import { Day as DayType, Activity as ActivityType } from '@/types/trip'

type DayCardDay = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type DayCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  places: { id: string; name: string } | null
}

type DayCardProps = {
  tripId: string
  tripTitle: string
  destination: string
  hotel: string | null
  day: DayCardDay
  activities: DayCardActivity[]
  moveActivityAction: (formData: FormData) => Promise<void>
}

export default function DayCard({
  tripId,
  tripTitle,
  destination,
  hotel,
  day,
  activities,
  moveActivityAction,
}: DayCardProps) {
  const normalizedDayTitle =
    day.title && !new RegExp(`^\\s*day\\s*${day.day_number}\\b`, 'i').test(day.title)
      ? day.title
      : null

  const { orderedItems, sections } = transformActivitiesForTimeline(activities)

  const shareActivities = orderedItems.map((item) => {
    if (item.kind === 'activity') {
      return {
        title: item.activity.title,
        activity_time: item.activity.activity_time,
        type: item.activity.type,
        notes: item.activity.notes,
        placeName: item.activity.places?.name,
      }
    }
    // flight_card
    return {
      title: item.activity.title,
      activity_time: item.activity.activity_time,
      type: 'transport' as const,
      notes: [item.meta.airline, item.meta.flightNumber, item.meta.route].filter(Boolean).join(' • '),
      placeName: null,
    }
  })

  const shortShareText = formatDayForWhatsApp(
    {
      tripTitle,
      dayNumber: day.day_number,
      date: day.date,
      city: destination,
      hotel,
      title: day.title,
      activities: shareActivities,
    },
    { length: 'short' }
  )

  const detailedShareText = formatDayForWhatsApp(
    {
      tripTitle,
      dayNumber: day.day_number,
      date: day.date,
      city: destination,
      hotel,
      title: day.title,
      activities: shareActivities,
    },
    { length: 'detailed' }
  )

  return (
    <Card key={day.id} className="rounded-[2rem] border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="font-serif text-3xl text-slate-900">
            Day {day.day_number}
            {normalizedDayTitle ? ` — ${normalizedDayTitle}` : ''}
          </div>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{day.date}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StoryGenerationSheet
            tripId={tripId}
            scope="day"
            dayId={day.id}
            relatedDate={day.date}
            title={`Generate Day ${day.day_number} Story`}
            triggerLabel="Generate Day Story"
            triggerClassName={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          />
          <WhatsAppShareSheet
            title={`Share Day ${day.day_number}`}
            shortText={shortShareText}
            detailedText={detailedShareText}
            triggerLabel="Share"
            triggerClassName={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          />
          <Link
            href={`/trips/${tripId}/itinerary/${day.id}/new`}
            className={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          >
            + Add Activity
          </Link>
        </div>
      </div>

      {orderedItems.length > 0 ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <TimeOfDaySection key={section.key} label={section.label}>
              {section.items.map((item) => {
                const globalIndex = orderedItems.indexOf(item)
                const key =
                  item.kind === 'activity'
                    ? item.activity.id
                    : item.activity.id

                return (
                  <ItineraryActivityRenderer
                    key={key}
                    tripId={tripId}
                    dayId={day.id}
                    item={item}
                    canMoveUp={item.kind === 'activity' ? globalIndex > 0 : false}
                    canMoveDown={item.kind === 'activity' ? globalIndex < orderedItems.length - 1 : false}
                    moveActivityAction={moveActivityAction}
                  />
                )
              })}
            </TimeOfDaySection>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
          No activities yet
        </div>
      )}
    </Card>
  )
}
