import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EmptyState from '@/app/components/ui/EmptyState'
import { buttonClass } from '@/app/components/ui/Button'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import BrandLine from '@/app/components/shared/BrandLine'
import {
  QuickActionsGrid,
  SavedPlacesCarousel,
  SectionHeader,
  StatCard,
  TodayCard,
  TripHeroCard,
} from '@/app/components/trips/dashboard'
import { resolvePlaceType } from '@/lib/places'
import { formatTripForWhatsApp } from '@/lib/share/whatsapp'
import {
  Trip as TripType,
  Day as DayType,
  Activity as ActivityType,
  Place as PlaceType,
} from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order'
>

type Place = Pick<
  PlaceType,
  'id' | 'name' | 'category' | 'place_type' | 'city' | 'visited'
>

type PlacePreview = {
  id: string
  name: string
  city: string | null
  visited: boolean
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} → ${endDate}`
  }

  return `${formatter.format(start)} → ${formatter.format(end)}`
}

function pickActiveDay(days: Day[]): Day | null {
  if (!days.length) return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const exact = days.find((day) => day.date === todayStr)
  if (exact) return exact

  const future = days
    .filter((day) => day.date > todayStr)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  if (future.length > 0) return future[0]

  const past = days
    .filter((day) => day.date < todayStr)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  if (past.length > 0) return past[0]

  return days[0]
}

function getNowNext(activities: Activity[]) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const timed = activities
    .filter((activity) => Boolean(activity.activity_time))
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      if (!a.activity_time || !b.activity_time) return 0
      return a.activity_time < b.activity_time ? -1 : 1
    })

  let nowActivity: Activity | null = null
  let nextActivity: Activity | null = null

  for (const activity of timed) {
    if (!activity.activity_time) continue

    const [hour, minute] = activity.activity_time.split(':').map(Number)
    const itemMinutes = hour * 60 + minute

    if (itemMinutes <= currentMinutes) {
      nowActivity = activity
    } else if (!nextActivity) {
      nextActivity = activity
      break
    }
  }

  if (!nowActivity && timed.length > 0) {
    nextActivity = timed[0]
  }

  return {
    now: nowActivity
      ? {
          title: nowActivity.title,
          time: nowActivity.activity_time,
          type: nowActivity.type,
        }
      : null,
    next: nextActivity
      ? {
          title: nextActivity.title,
          time: nextActivity.activity_time,
          type: nextActivity.type,
        }
      : null,
  }
}

function toPlacePreview(items: Place[]): PlacePreview[] {
  return items.slice(0, 5).map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
    visited: Boolean(place.visited),
  }))
}

export default async function TripDashboardPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

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
    .eq('user_id', user.id)
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

  const safeDays = days || []
  const dayIds = safeDays.map((day) => day.id)

  const { data: activitiesData, error: activitiesError } = dayIds.length
    ? await supabase
        .from('activities')
        .select('id, day_id, title, activity_time, type, notes, sort_order')
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
    .select('id, name, category, place_type, city, visited')
    .eq('trip_id', tripId)
    .returns<Place[]>()

  const safePlaces = places || []

  const hotel =
    safePlaces.find((place) => resolvePlaceType(place) === 'hotel')?.name ?? null

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
    days: safeDays.map((day) => ({
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

  const activeDay = pickActiveDay(safeDays)
  const activeDayActivities = activeDay
    ? activities.filter((activity) => activity.day_id === activeDay.id)
    : []
  const nowNext = getNowNext(activeDayActivities)

  const placeGroups = [
    {
      label: 'Attractions',
      emoji: '📍',
      places: toPlacePreview(
        safePlaces.filter((place) => resolvePlaceType(place) === 'attraction')
      ),
    },
    {
      label: 'Restaurants',
      emoji: '🍜',
      places: toPlacePreview(
        safePlaces.filter((place) => resolvePlaceType(place) === 'restaurant')
      ),
    },
    {
      label: 'Shopping',
      emoji: '🛍️',
      places: toPlacePreview(
        safePlaces.filter((place) => resolvePlaceType(place) === 'shopping')
      ),
    },
  ]

  const quickActions = [
    {
      label: 'Plan today',
      subtitle: 'Open your live day timeline',
      icon: '📍',
      href: `/trips/${tripId}/today`,
    },
    {
      label: 'Add place',
      subtitle: 'Save a must-visit spot',
      icon: '➕',
      href: `/trips/${tripId}/places/new`,
    },
    {
      label: 'Find food nearby',
      subtitle: 'Search restaurants quickly',
      icon: '🍽️',
      href: `/trips/${tripId}/places/new?placeType=restaurant`,
    },
    {
      label: 'Explore attractions',
      subtitle: 'Find highlights around you',
      icon: '🧭',
      href: `/trips/${tripId}/places/new?placeType=attraction`,
    },
  ]

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4">
        <Link href="/trips" className={buttonClass({ size: 'sm', variant: 'ghost' })}>
          ← Back to Trips
        </Link>
      </div>

      <div className="space-y-6">
        <TripHeroCard
          destination={trip.destination}
          dateRangeLabel={formatDateRange(trip.start_date, trip.end_date)}
          tripTitle={trip.title}
          hotel={hotel}
          tripId={tripId}
          shareButton={
            <WhatsAppShareSheet
              title="Share full itinerary"
              shortText={shortShareText}
              detailedText={detailedShareText}
              triggerLabel="Share"
              triggerClassName={buttonClass({
                variant: 'secondary',
                className: 'border-white/50 bg-white/10 text-white hover:bg-white/20',
              })}
            />
          }
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <BrandLine className="text-gray-500" />
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <span className="rounded-full border border-gray-200 px-2 py-1">Plan</span>
              <span className="rounded-full border border-gray-200 px-2 py-1">Go</span>
              <span className="rounded-full border border-gray-200 px-2 py-1">Share</span>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Today"
            subtitle="Go make today count — see what’s happening now and what’s next"
          />
          {activeDay ? (
            <TodayCard
              dayLabel={`Day ${activeDay.day_number}${activeDay.title ? ` · ${activeDay.title}` : ''}`}
              nowActivity={nowNext.now}
              nextActivity={nowNext.next}
              todayHref={`/trips/${tripId}/today`}
            />
          ) : (
            <EmptyState
              title="No day planned yet"
              description="Create or generate your itinerary to unlock Today planning."
            />
          )}
        </section>

        <section>
          <SectionHeader
            title="Quick Actions"
            subtitle="Plan your next move in one tap"
          />
          <QuickActionsGrid actions={quickActions} />
        </section>

        <section>
          <SectionHeader
            title="Saved Places"
            subtitle="Your curated spots by category"
            actionLabel="View all"
            actionHref={`/trips/${tripId}/places`}
          />
          <SavedPlacesCarousel
            groups={placeGroups}
            viewAllHref={`/trips/${tripId}/places`}
          />
        </section>

        <section>
          <SectionHeader title="Trip Stats" subtitle="A quick pulse check" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Saved Places" value={safePlaces.length} />
            <StatCard label="Planned Days" value={safeDays.length} />
            <StatCard label="Activities" value={activities.length} />
          </div>
        </section>

        <section>
          <SectionHeader title="Memories" subtitle="Future-ready" />
          <EmptyState
            title="Memories and summaries coming soon"
            description="Share the moments that mattered with stories, day recaps, and highlights."
          />
        </section>
      </div>
    </main>
  )
}
