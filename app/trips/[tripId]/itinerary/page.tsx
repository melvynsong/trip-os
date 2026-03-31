export const dynamic = 'force-dynamic';
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import DayCard from '@/app/components/itinerary/DayCard'
import { fetchTripWeather } from '@/lib/weather/fetchTripWeather'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { buttonClass } from '@/app/components/ui/Button'
import { resolvePlaceType } from '@/lib/places'
import { formatTripForWhatsApp } from '@/lib/share/whatsapp'
import { Trip as TripType, Day as DayType, Activity as ActivityType, Place as PlaceType } from '@/types/trip'
import { listTripFlights } from '@/lib/flights/trip'

type Props = {
  params: { tripId: string } | Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  metadata?: any;
  places: { id: string; name: string } | null
}

type Place = Pick<PlaceType, 'id' | 'name' | 'category' | 'place_type'>

export default async function ItineraryPage({ params }: Props) {
  // Support both direct object and Promise for params
  let tripId: string | undefined
  if (typeof params === 'object' && 'then' in params && typeof params.then === 'function') {
    // It's a Promise
    const resolved = await params
    tripId = resolved?.tripId
  } else {
    tripId = (params as { tripId?: string })?.tripId
  }
  // Debug info for troubleshooting
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[ItineraryPage][DEBUG] tripId:', tripId, {
      params,
      backHref: `/trips/${tripId}`
    });
  }
  // Show debug info at the top of the page
  const debugInfo = { tripId, params }
  const supabase = await createClient()

  // --- Fetch trip, days, activities, places as before ---

  async function moveActivity(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
          <TripHeader
            dateRange={`${trip.start_date} → ${trip.end_date}`}
            title={trip.title}
            subtitle={trip.destination}
            backHref={`/trips/${tripId}`}
            backLabel="Back to Trip"
            actions={
              <>
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
                    className: 'rounded-full',
                  })}
                >
                  AI Generate Itinerary
                </Link>
                <Link
                  href={`/trips/${tripId}/packing-list`}
                  className={buttonClass({
                    size: 'sm',
                    variant: 'secondary',
                    className: 'rounded-full',
                  })}
                >
                  🧳 Packing List
                </Link>
                <WhatsAppShareSheet
                  tripId={tripId}
                  tripTitle={trip.title}
                  startDate={trip.start_date}
                  endDate={trip.end_date}
                  destination={trip.destination}
                  days={days}
                  activities={activities}
                  places={places}
                  title={`Share ${trip.title} itinerary`}
                  shortText={shortTripShareText}
                  detailedText={detailedTripShareText}
                  triggerLabel="Share itinerary"
                  triggerClassName={buttonClass({
                    size: 'sm',
                    variant: 'secondary',
                    className: 'rounded-full',
                  })}
                />
              </>
            }
          />
        <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
          <strong>Debug Info:</strong>
          <ul className="mt-1 space-y-1">
            <li><b>tripId:</b> {String(tripId)}</li>
            <li><b>params:</b> {JSON.stringify(params)}</li>
            <li><b>User:</b> {user?.id || 'none (not logged in)'}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Trip ID is missing or invalid.
        </div>
      </TripPageShell>
    )
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('id', tripId)
    .single<Trip>()

  if (tripError || !trip) {
    return (
      <TripPageShell>
        <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
          <strong>Debug Info:</strong>
          <ul className="mt-1 space-y-1">
            <li><b>tripId:</b> {String(tripId)}</li>
            <li><b>params:</b> {JSON.stringify(params)}</li>
            <li><b>User:</b> {user?.id || 'none (not logged in)'}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Trip not found or you do not have access.
        </div>
      </TripPageShell>
    )
  }

  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id, trip_id, day_number, date, title')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .returns<Day[]>()

  if (daysError) {
    return (
      <TripPageShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load itinerary days: {daysError.message}
        </div>
      </TripPageShell>
    )
  }

  // --- Fetch weather for the trip date range (non-blocking) ---
  let weatherByDate: Record<string, any> = {}
  if (trip && days && days.length > 0) {
    try {
      weatherByDate = await fetchTripWeather(trip.destination, trip.start_date, trip.end_date)
    } catch (err) {
      // Already logged in helper, but log here for clarity
      console.error('[Itinerary] Weather fetch failed:', err)
    }
  }

  if (!days || days.length === 0) {
    return (
      <TripPageShell className="space-y-6">
        <TripHeader
          dateRange={`${trip.start_date} → ${trip.end_date}`}
          title={trip.title}
          subtitle={trip.destination}
          backHref={`/trips/${tripId}`}
          backLabel="Back to Trip"
        />

        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-slate-500">
          No itinerary days found for this trip.
        </div>
      </TripPageShell>
    )
  }

  const dayIds = days.map((day) => day.id)

  let activities: Activity[] = []

  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('id, day_id, title, activity_time, type, notes, sort_order, place_id, created_at, metadata, places(id, name)')
    .in('day_id', dayIds)
    .order('day_id', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .returns<Activity[]>()

  if (activitiesError) {
    return (
      <TripPageShell className="max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load activities: {activitiesError.message}
        </div>
      </TripPageShell>
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
      return (
        <TripPageShell className="space-y-8">
          <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
            <strong>Debug Info:</strong>
            <ul className="mt-1 space-y-1">
              <li><b>tripId:</b> {String(tripId)}</li>
              <li><b>params:</b> {JSON.stringify(params)}</li>
              <li><b>User:</b> {user?.id || 'none (not logged in)'}</li>
            </ul>
          </div>
          <TripHeader
            dateRange={`${trip.start_date} → ${trip.end_date}`}
            title={trip.title}
            subtitle={trip.destination}
            backHref={`/trips/${tripId}`}
            backLabel="Back to Trip"
            actions={
              <>
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
                    className: 'rounded-full',
                  })}
                >
                  AI Generate Itinerary
                </Link>
                <Link
                  href={`/trips/${tripId}/packing-list`}
                  className={buttonClass({
                    size: 'sm',
                    variant: 'secondary',
                    className: 'rounded-full',
                  })}
                >
                  🧳 Packing List
                </Link>
                <WhatsAppShareSheet
                  tripId={tripId}
                  tripTitle={trip.title}
                  startDate={trip.start_date}
                  endDate={trip.end_date}
                  destination={trip.destination}
                  days={days}
                  activities={activities}
                  places={places}
                />
              </>
            }
          />
              href={`/trips/${tripId}/ai-itinerary`}
              className={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            >
              AI Generate Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/packing-list`}
              className={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            >
              🧳 Packing List
            </Link>
            <WhatsAppShareSheet
              title={`Share ${trip.title} itinerary`}
              shortText={shortTripShareText}
              detailedText={detailedTripShareText}
              triggerLabel="Share itinerary"
              triggerClassName={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            />
          </>
        }
      />

      <div className="space-y-6">
        {days.map((day) => {
          const dayActivities = activities.filter((activity) => activity.day_id === day.id)
          // Normalize date to YYYY-MM-DD (avoid timezone bugs)
          const dateKey = String(day.date).slice(0, 10)
          const weather = weatherByDate[dateKey] || null
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
              weather={weather}
            />
          )
        })}
      </div>
    </TripPageShell>
  )
}