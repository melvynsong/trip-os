import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
> & {
  places: { id: string; name: string } | null
}

export default async function ItineraryPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  async function moveActivity(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const dayId = String(formData.get('day_id') || '').trim()
    const activityId = String(formData.get('activity_id') || '').trim()
    const direction = String(formData.get('direction') || '').trim()

    if (!dayId || !activityId || (direction !== 'up' && direction !== 'down')) {
      return
    }

    const { data: day } = await supabase
      .from('days')
      .select('id')
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .single()

    if (!day) {
      return
    }

    const { data: dayActivities, error: dayActivitiesError } = await supabase
      .from('activities')
      .select('id, sort_order')
      .eq('day_id', dayId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (dayActivitiesError || !dayActivities || dayActivities.length < 2) {
      return
    }

    const normalized = dayActivities.map((activity, index) => ({
      id: activity.id,
      sort_order: index + 1,
    }))

    const currentIndex = normalized.findIndex((activity) => activity.id === activityId)

    if (currentIndex === -1) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= normalized.length) {
      return
    }

    const reordered = [...normalized]
    ;[reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ]

    await Promise.all(
      reordered.map((activity, index) =>
        supabase
          .from('activities')
          .update({ sort_order: index + 1 })
          .eq('id', activity.id)
          .eq('day_id', dayId)
      )
    )

    revalidatePath(`/trips/${tripId}/itinerary`)
  }

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
    .select('id, day_id, title, activity_time, type, notes, sort_order, place_id, places(id, name)')
    .in('day_id', dayIds)
    .order('sort_order', { ascending: true })
    .order('activity_time', { ascending: true })
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
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/trips/${tripId}`}
            className="rounded-xl border px-4 py-2"
          >
            ← Back to Trip
          </Link>
          <Link
            href={`/trips/${tripId}/today`}
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            📍 Today
          </Link>
          <Link
            href={`/trips/${tripId}/ai-itinerary`}
            className="rounded-xl border px-4 py-2"
          >
            AI Generate Itinerary
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const dayActivities = activities.filter(
            (activity) => activity.day_id === day.id
          )

          return (
            <DayCard
              key={day.id}
              tripId={tripId}
              day={day}
              activities={dayActivities}
              moveActivityAction={moveActivity}
            />
          )
        })}
      </div>
    </main>
  )
}