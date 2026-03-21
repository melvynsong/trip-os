import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/app/components/shared/PageHeader'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import { getEmoji } from '@/lib/utils/getEmoji'
import { resolvePlaceType } from '@/lib/places'
import { formatTripForWhatsApp } from '@/lib/share/whatsapp'
import { Trip as TripType, Day as DayType, Activity as ActivityType, Place as PlaceType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order'
>

type Place = Pick<PlaceType, 'id' | 'name' | 'category' | 'place_type'>

export default async function ItineraryPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('id', tripId)
    .single<Trip>()

  if (tripError || !trip) {
    notFound()
  }

  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id, trip_id, day_number, date, title')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .returns<Day[]>()

  if (daysError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load itinerary days: {daysError.message}
        </div>
      </main>
    )
  }

  if (!days || days.length === 0) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="text-gray-600">{trip.destination}</p>
        </div>

        <div className="rounded-2xl border border-dashed p-6 text-gray-500">
          No itinerary days found for this trip.
        </div>
      </main>
    )
  }

  const dayIds = days.map((day) => day.id)

  let activities: Activity[] = []

  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('id, day_id, title, activity_time, type, notes, sort_order')
    .in('day_id', dayIds)
    .order('activity_time', { ascending: true })
    .order('sort_order', { ascending: true })
    .returns<Activity[]>()

  if (activitiesError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load activities: {activitiesError.message}
        </div>
      </main>
    )
  }

  activities = activitiesData || []

  const { data: places } = await supabase
    .from('places')
    .select('id, name, category, place_type')
    .eq('trip_id', tripId)
    .returns<Place[]>()

  const hotel =
    places?.find((place) => resolvePlaceType(place) === 'hotel')?.name ?? null

  const destinations = trip.destination
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const tripShareInput = {
    tripTitle: trip.title,
    startDate: trip.start_date,
    endDate: trip.end_date,
    destinations,
    hotel,
    days: days.map((day) => ({
      dayNumber: day.day_number,
      date: day.date,
      city: destinations[0] ?? trip.destination,
      title: day.title,
      hotel,
      activities: activities
        .filter((activity) => activity.day_id === day.id)
        .map((activity) => ({
          title: activity.title,
          type: activity.type,
          activity_time: activity.activity_time,
          notes: activity.notes,
        })),
    })),
  }

  const shortShareText = formatTripForWhatsApp(tripShareInput, {
    length: 'short',
  })
  const detailedShareText = formatTripForWhatsApp(tripShareInput, {
    length: 'detailed',
  })

  return (
    <main className="mx-auto max-w-5xl p-6">
      <PageHeader
        title={trip.title}
        subtitle={`${trip.destination} · ${trip.start_date} → ${trip.end_date}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/trips" className="rounded-xl border px-4 py-2">
              ← Back to Trips
            </Link>
            <Link
              href={`/trips/${tripId}/today`}
              className="rounded-xl bg-black px-4 py-2 text-white"
            >
              📍 Today
            </Link>
            <WhatsAppShareSheet
              title="Share full itinerary"
              shortText={shortShareText}
              detailedText={detailedShareText}
              triggerLabel="Share"
              triggerClassName="rounded-xl border px-4 py-2"
            />
            <Link
              href={`/trips/${tripId}/ai-itinerary`}
              className="rounded-xl border px-4 py-2"
            >
              AI Generate Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/itinerary`}
              className="rounded-xl border px-4 py-2"
            >
              View Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/places`}
              className="rounded-xl border px-4 py-2"
            >
              Saved Places
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {days.map((day) => {
          const dayActivities = activities.filter(
            (activity) => activity.day_id === day.id
          )

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

              {dayActivities.length > 0 ? (
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-4 border-blue-500 pl-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {getEmoji(activity.type)} {activity.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.activity_time || 'No time'}
                        </div>
                      </div>

                      <div className="mt-1 text-sm text-gray-500 capitalize">
                        {activity.type}
                      </div>

                      {activity.notes ? (
                        <div className="mt-2 text-sm text-gray-700">
                          {activity.notes}
                        </div>
                      ) : null}

                      <div className="mt-3">
                        <Link
                          href={`/trips/${tripId}/itinerary/${day.id}/activities/${activity.id}/edit`}
                          className="text-sm underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">No activities yet</div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}