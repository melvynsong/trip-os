import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function getEmoji(type: string) {
  switch (type) {
    case 'food':
      return '🍜'
    case 'attraction':
      return '📍'
    case 'shopping':
      return '🛍️'
    case 'transport':
      return '🚗'
    case 'hotel':
      return '🏨'
    case 'note':
      return '📝'
    default:
      return '📌'
  }
}

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
}

type Day = {
  id: string
  trip_id: string
  day_number: number
  date: string
  title: string | null
}

type Activity = {
  id: string
  day_id: string
  title: string
  activity_time: string | null
  type: string
  notes: string | null
  sort_order: number
}

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

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">{trip.destination}</p>
        <p className="text-sm text-gray-500">
          {trip.start_date} → {trip.end_date}
        </p>
      </div>

      <div className="mb-6">
        <Link
          href={`/trips/${tripId}`}
          className="rounded-xl border px-4 py-2"
        >
          ← Back to Trip
        </Link>
      </div>

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