import Link from 'next/link'
import ActivityCard from '@/app/components/itinerary/ActivityCard'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'
import { formatDayForWhatsApp } from '@/lib/share/whatsapp'
import { Day as DayType, Activity as ActivityType } from '@/types/trip'

type DayCardDay = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type DayCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
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
  const shortShareText = formatDayForWhatsApp(
    {
      tripTitle,
      dayNumber: day.day_number,
      date: day.date,
      city: destination,
      hotel,
      title: day.title,
      activities: activities.map((activity) => ({
        title: activity.title,
        activity_time: activity.activity_time,
        type: activity.type,
        notes: activity.notes,
        placeName: activity.places?.name,
      })),
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
      activities: activities.map((activity) => ({
        title: activity.title,
        activity_time: activity.activity_time,
        type: activity.type,
        notes: activity.notes,
        placeName: activity.places?.name,
      })),
    },
    { length: 'detailed' }
  )

  return (
    <Card key={day.id} className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-lg">
            Day {day.day_number}
            {day.title ? ` — ${day.title}` : ''}
          </div>
          <div className="text-sm text-gray-500">{day.date}</div>
        </div>

        <div className="flex items-center gap-2">
          <StoryGenerationSheet
            tripId={tripId}
            scope="day"
            dayId={day.id}
            relatedDate={day.date}
            title={`Generate Day ${day.day_number} Story`}
            triggerLabel="Generate Day Story"
            triggerClassName={buttonClass({ size: 'sm' })}
          />
          <WhatsAppShareSheet
            title={`Share Day ${day.day_number}`}
            shortText={shortShareText}
            detailedText={detailedShareText}
            triggerLabel="Share"
            triggerClassName={buttonClass({ size: 'sm' })}
          />
          <Link
            href={`/trips/${tripId}/itinerary/${day.id}/new`}
            className={buttonClass({ size: 'sm' })}
          >
            + Add Activity
          </Link>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              tripId={tripId}
              activity={activity}
              canMoveUp={index > 0}
              canMoveDown={index < activities.length - 1}
              moveActivityAction={moveActivityAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">No activities yet</div>
      )}
    </Card>
  )
}
