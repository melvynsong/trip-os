import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditActivityForm from '@/app/components/itinerary/EditActivityForm'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { isLikelyFlightActivity } from '@/lib/flights/activity'
import { getFlightDisplayModel } from '@/lib/flights/flightDisplayModel'
import type { ActivityType } from '@/types/trip'
import type { ActivityActionResult } from '@/lib/trips/activity-types'

const ACTIVITY_TYPES: Array<{ value: ActivityType; label: string }> = [
  { value: 'food', label: '🍜 Food' },
  { value: 'attraction', label: '📍 Attraction' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'transport', label: '✈️ Transport (Flight/Train/Bus)' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'note', label: '📝 Note' },
  { value: 'other', label: '📌 Other' },
]

type Props = {
  params: Promise<{
    tripId: string
    dayId: string
    activityId: string
  }>
}

export default async function EditActivityPage({ params }: Props) {
  const { tripId, dayId, activityId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination')
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    notFound()
  }

  const { data: day, error: dayError } = await supabase
    .from('days')
    .select('id, trip_id, day_number, date')
    .eq('id', dayId)
    .eq('trip_id', tripId)
    .single()

  if (dayError || !day) {
    notFound()
  }

  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('*, metadata')
    .eq('id', activityId)
    .eq('day_id', dayId)
    .single()

  if (activityError || !activity) {
    notFound()
  }

  const { data: places } = await supabase
    .from('places')
    .select('id, name')
    .eq('trip_id', tripId)
    .order('name', { ascending: true })

  const flightAccess = await getCurrentUserFlightAccessState().catch(() => null)

  async function updateActivity(formData: FormData): Promise<ActivityActionResult> {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Unauthorized' }
    }

    const title = String(formData.get('title') || '').trim()
    const activity_time = String(formData.get('activity_time') || '').trim()
    const rawType = String(formData.get('type') || '').trim()
    const flightMode = String(formData.get('flight_mode') || '') === '1'
    const notes = String(formData.get('notes') || '').trim()
    const place_id = String(formData.get('place_id') || '').trim()

    if (flightMode) {
      return { ok: true, redirect: `/trips/${tripId}/itinerary` }
    }

    const type: ActivityType = ACTIVITY_TYPES.some((option) => option.value === rawType)
      ? (rawType as ActivityType)
      : 'other'

    if (!title) {
      return { ok: false, error: 'Title is required' }
    }

    const { error } = await supabase
      .from('activities')
      .update({
        title,
        activity_time: activity_time || null,
        type,
        notes: notes || null,
        place_id: place_id || null,
      })
      .eq('id', activityId)
      .eq('day_id', dayId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  async function deleteActivity(): Promise<ActivityActionResult> {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('day_id', dayId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, redirect: `/trips/${tripId}/itinerary` }
  }

  // --- FLIGHT REHYDRATION ---
  let initialIsFlight = isLikelyFlightActivity({ type: activity.type as ActivityType, title: activity.title, notes: activity.notes });
  let flightModel = null;
  if (activity.type === 'transport' && activity.metadata) {
    flightModel = getFlightDisplayModel(activity);
    initialIsFlight = true;
  }
  // Debug log
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[EditActivity][DEBUG] raw:', activity, 'flightModel:', flightModel);
  }
  return (
    <TripPageShell className="max-w-2xl space-y-6">
      <TripHeader
        dateRange={day.date}
        title="Edit activity"
        subtitle={`${trip.title} · Day ${day.day_number}`}
        backHref={`/trips/${tripId}/itinerary`}
        backLabel="Back to Itinerary"
      />

      <EditActivityForm
        tripId={tripId}
        tripTitle={trip.title}
        destination={trip.destination}
        dayDate={day.date}
        initialTitle={flightModel ? `${flightModel.airline} ${flightModel.flightNumber}` : activity.title}
        initialTime={flightModel ? flightModel.departure.datetime.slice(11, 16) : activity.activity_time}
        initialType={activity.type as ActivityType}
        initialIsFlight={initialIsFlight}
        initialPlaceId={activity.place_id}
        initialNotes={flightModel ? flightModel.notes : activity.notes}
        initialPlaces={places || []}
        updateActivity={updateActivity}
        deleteActivity={deleteActivity}
        canUseFlights={flightAccess?.canAccess ?? false}
        flightAccessMessage={flightAccess ? getFlightAccessMessage(flightAccess) : 'Flight (Beta) is unavailable right now.'}
        // Pass full flightModel for further customization if needed
        flightModel={flightModel}
      />
    </TripPageShell>
  )
}