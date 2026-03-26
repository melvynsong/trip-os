import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonClass } from '@/app/components/ui/Button'
import DaySection from '@/app/components/trips/story/DaySection'
import StoryGenerator from '@/app/components/trips/story/StoryGenerator'
import TripHeader from '@/app/components/trips/story/TripHeader'
import Card from '@/app/components/ui/Card'
import { getStoryPeriod } from '@/lib/trip-storytelling'
import {
  Trip as TripType,
  Day as DayType,
  Activity as ActivityType,
  Place as PlaceType,
} from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date' | 'cover_image'>

type TripWithoutCover = Omit<Trip, 'cover_image'>

type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id'
>

type Place = Pick<
  PlaceType,
  'id' | 'name' | 'address'
>

export default async function TripDashboardPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  let { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date, cover_image')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single<Trip>()

  if (tripError && /cover_image/i.test(tripError.message)) {
    const fallback = await supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single<TripWithoutCover>()

    if (!fallback.error && fallback.data) {
      trip = { ...fallback.data, cover_image: null }
      tripError = null
    }
  }

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

  const safeDays = days || []
  const dayIds = safeDays.map((day) => day.id)

  const { data: activitiesData, error: activitiesError } = dayIds.length
    ? await supabase
        .from('activities')
        .select('id, day_id, title, activity_time, type, notes, sort_order, place_id')
        .in('day_id', dayIds)
        .order('sort_order', { ascending: true })
        .order('activity_time', { ascending: true })
        .returns<Activity[]>()
    : { data: [], error: null }

  if (activitiesError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load activities: {activitiesError.message}
        </div>
      </main>
    )
  }

  const activities = activitiesData || []

  const { data: places } = await supabase
    .from('places')
    .select('id, name, address')
    .eq('trip_id', tripId)
    .returns<Place[]>()

  const safePlaces = places || []
  const placeNameById = new Map(safePlaces.map((place) => [place.id, place.name]))

  const daySections = safeDays.map((day) => {
    const dayActivities = activities
      .filter((activity) => activity.day_id === day.id)
      .map((activity) => ({
        id: activity.id,
        title: activity.title,
        time: activity.activity_time,
        location: activity.place_id ? placeNameById.get(activity.place_id) || null : null,
        notes: activity.notes,
      }))

    const morning = dayActivities.filter((item) => getStoryPeriod(item.time) === 'morning')
    const afternoon = dayActivities.filter((item) => getStoryPeriod(item.time) === 'afternoon')
    const evening = dayActivities.filter((item) => getStoryPeriod(item.time) === 'evening')
    const anytime = dayActivities.filter((item) => getStoryPeriod(item.time) === 'anytime')

    return {
      day,
      groups: [
        { label: 'Morning', description: 'Ease into the day with a clear beginning.', items: morning },
        { label: 'Afternoon', description: 'The middle chapter where the journey opens up.', items: afternoon },
        { label: 'Evening', description: 'A softer ending, dinner, notes, and atmosphere.', items: evening },
        { label: 'Anytime', description: 'Moments without a fixed time still belong in the story.', items: anytime },
      ],
    }
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-5">
        <Link
          href="/trips"
          className={buttonClass({
            size: 'sm',
            variant: 'ghost',
            className: 'rounded-full text-slate-700 hover:bg-sky-50/70',
          })}
        >
          ← Back to Trips
        </Link>
      </div>

      <div className="space-y-8">
        <TripHeader
          trip={{
            id: trip.id,
            title: trip.title,
            destination: trip.destination,
            startDate: trip.start_date,
            endDate: trip.end_date,
            coverImage: trip.cover_image,
          }}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="space-y-8">
            {daySections.length > 0 ? (
              daySections.map(({ day, groups }, index) => (
                <DaySection
                  key={day.id}
                  tripId={tripId}
                  day={{
                    id: day.id,
                    dayNumber: day.day_number,
                    date: day.date,
                    title: day.title,
                  }}
                  groups={groups}
                  isLast={index === daySections.length - 1}
                />
              ))
            ) : (
              <Card className="rounded-[2rem] border-dashed border-slate-200 bg-white p-8">
                <h2 className="font-serif text-3xl text-slate-900">This is your story.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Your trip exists, but the day-by-day chapters still need their first moments.
                </p>
                <div className="mt-5">
                  <Link
                    href={`/trips/${tripId}/ai-itinerary`}
                    className={buttonClass({
                      variant: 'primary',
                      className: 'rounded-full',
                    })}
                  >
                    Add your first moment
                  </Link>
                </div>
              </Card>
            )}
          </div>

          <div className="min-w-0 space-y-6 xl:sticky xl:top-6">
            <StoryGenerator tripId={tripId} tripTitle={trip.title} />

            <Card className="space-y-4 rounded-[2rem] border-slate-200 bg-white p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Story notes</p>
                <h2 className="mt-3 font-serif text-3xl text-slate-900">Your trip at a glance</h2>
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                <p>{safeDays.length} planned day{safeDays.length === 1 ? '' : 's'}.</p>
                <p>{activities.length} saved moment{activities.length === 1 ? '' : 's'}.</p>
                <p>{safePlaces.length} saved place{safePlaces.length === 1 ? '' : 's'} helping shape the narrative.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/trips/${tripId}/today`}
                  className={buttonClass({ variant: 'secondary', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
                >
                  View today
                </Link>
                <Link
                  href={`/trips/${tripId}/places`}
                  className={buttonClass({ variant: 'secondary', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
                >
                  Explore places
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
