import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TodayView, { type TodayViewProps } from '@/app/components/today/TodayView'
import { type TodayItem } from '@/app/components/today/TimelineItemCard'
import { Trip as TripType, Day as DayType, Activity as ActivityType, Place as PlaceType } from '@/types/trip'

type Props = { params: Promise<{ tripId: string }> }

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date' | 'notes'>
type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>
type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'status' | 'sort_order'
>
type Place = Pick<PlaceType, 'id' | 'name' | 'category'>

/** Determine the best day to show for Today View (closest to real today) */
function pickActiveDay(days: Day[]): Day | null {
  if (!days || days.length === 0) return null

  const todayStr = new Date().toISOString().slice(0, 10)

  // Exact match
  const exact = days.find((d) => d.date === todayStr)
  if (exact) return exact

  // Nearest future day
  const future = days
    .filter((d) => d.date > todayStr)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  if (future.length > 0) return future[0]

  // Most recent past day
  const past = days
    .filter((d) => d.date < todayStr)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  if (past.length > 0) return past[0]

  return days[0]
}

/** Derive trip status relative to real today */
function getTripStatus(
  startDate: string,
  endDate: string
): TodayViewProps['tripStatus'] {
  const todayStr = new Date().toISOString().slice(0, 10)
  if (todayStr < startDate) return 'upcoming'
  if (todayStr > endDate) return 'past'
  return 'active'
}

export default async function TodayPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date, notes')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single<Trip>()

  if (tripError || !trip) {
    notFound()
  }

  // Load all days
  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id, trip_id, day_number, date, title')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .returns<Day[]>()

  if (daysError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load trip days: {daysError.message}
        </div>
      </main>
    )
  }

  if (!days || days.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <Link href={`/trips/${tripId}`} className="inline-block rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          ← Back to Trip
        </Link>
        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          <div className="text-3xl">📅</div>
          <div className="mt-2 font-medium">No itinerary days found</div>
          <div className="mt-1 text-sm">
            Generate your itinerary first, then come back to Today View.
          </div>
          <Link
            href={`/trips/${tripId}/ai-itinerary`}
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            AI Generate Itinerary
          </Link>
        </div>
      </main>
    )
  }

  const activeDay = pickActiveDay(days)

  if (!activeDay) {
    notFound()
  }

  // Load activities for the active day
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('id, day_id, title, activity_time, type, notes, status, sort_order')
    .eq('day_id', activeDay.id)
    .order('sort_order', { ascending: true })
    .order('activity_time', { ascending: true })
    .returns<Activity[]>()

  if (activitiesError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load activities: {activitiesError.message}
        </div>
      </main>
    )
  }

  // Load saved places to detect hotel
  const { data: places } = await supabase
    .from('places')
    .select('id, name, category')
    .eq('trip_id', tripId)
    .returns<Place[]>()

  const hotel =
    places?.find((p) => p.category === 'hotel')?.name ?? null

  const tripStatus = getTripStatus(trip.start_date, trip.end_date)

  const initialItems: TodayItem[] = (activitiesData ?? []).map((a) => ({
    id: a.id,
    day_id: a.day_id,
    title: a.title,
    activity_time: a.activity_time,
    type: a.type,
    notes: a.notes,
    status: a.status,
    sort_order: a.sort_order,
  }))

  return (
    <main>
      <TodayView
        tripId={tripId}
        dayId={activeDay.id}
        tripTitle={trip.title}
        destination={trip.destination}
        date={activeDay.date}
        dayTitle={activeDay.title}
        dayNumber={activeDay.day_number}
        hotel={hotel}
        tripStatus={tripStatus}
        initialItems={initialItems}
      />
    </main>
  )
}
