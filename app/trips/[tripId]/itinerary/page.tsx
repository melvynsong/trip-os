import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import DayCard from '@/app/components/itinerary/DayCard'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import { buttonClass } from '@/app/components/ui/Button'
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
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
> & {
  places: { id: string; name: string } | null
}

type Place = Pick<PlaceType, 'id' | 'name' | 'category' | 'place_type'>

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
      redirect('/')
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
    redirect('/')
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load itinerary days: {daysError.message}
        </div>
      </main>
    )
  }

  if (!days || days.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6">
          <h1 className="font-serif text-4xl text-slate-900">{trip.title}</h1>
          <p className="mt-2 text-base text-slate-600">{trip.destination}</p>
        </div>

        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-slate-500">
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

  const { data: places } = await supabase
    .from('places')
    .select('id, name, category, place_type')
    .eq('trip_id', tripId)
    .returns<Place[]>()

  const hotel =
    places?.find((place) => resolvePlaceType(place) === 'hotel')?.name ?? null

  const shareDays = days.map((day) => {
    const dayActivities = activities
      .filter((activity) => activity.day_id === day.id)
      .map((activity) => ({
        title: activity.title,
        activity_time: activity.activity_time,
        type: activity.type,
        notes: activity.notes,
        placeName: activity.places?.name ?? null,
      }))

    return {
      dayNumber: day.day_number,
      date: day.date,
      city: trip.destination,
      title: day.title,
      hotel,
      activities: dayActivities,
    }
  })

  const tripShareInput = {
    tripTitle: trip.title,
    startDate: trip.start_date,
    endDate: trip.end_date,
    destinations: [trip.destination],
    hotel,
    days: shareDays,
  }

  const shortTripShareText = formatTripForWhatsApp(tripShareInput, { length: 'short' })
  const detailedTripShareText = formatTripForWhatsApp(tripShareInput, { length: 'detailed' })

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {trip.start_date} → {trip.end_date}
          </p>
          <div>
            <h1 className="font-serif text-4xl text-slate-900 sm:text-5xl">{trip.title}</h1>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">{trip.destination}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/trips/${tripId}`}
            className={buttonClass({
              size: 'sm',
              variant: 'ghost',
              className: 'rounded-full text-slate-700 hover:bg-sky-50/70',
            })}
          >
            ← Back to Trip
          </Link>
          <Link
            href={`/trips/${tripId}/today`}
            className={buttonClass({
              size: 'sm',
              variant: 'primary',
              className: 'rounded-full',
            })}
          >
            📍 Today
          </Link>
          <Link
            href={`/trips/${tripId}/ai-itinerary`}
            className={buttonClass({
              size: 'sm',
              variant: 'secondary',
              className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70',
            })}
          >
            AI Generate Itinerary
          </Link>
          <WhatsAppShareSheet
            title={`Share ${trip.title} itinerary`}
            shortText={shortTripShareText}
            detailedText={detailedTripShareText}
            triggerLabel="Share itinerary"
            triggerClassName={buttonClass({
              size: 'sm',
              variant: 'secondary',
              className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70',
            })}
          />
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
                tripTitle={trip.title}
                destination={trip.destination}
                hotel={hotel}
                day={day}
                activities={dayActivities}
                moveActivityAction={moveActivity}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}