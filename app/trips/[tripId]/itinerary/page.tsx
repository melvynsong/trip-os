import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DayCard from '@/app/components/itinerary/DayCard'
import { Trip as TripType, Day as DayType, Activity as ActivityType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order'
>

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

          return <DayCard key={day.id} tripId={tripId} day={day} activities={dayActivities} />
        })}
      </div>
    </main>
  )
}