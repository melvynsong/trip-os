import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditActivityForm from '@/app/components/itinerary/EditActivityForm'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import type { ActivityType } from '@/types/trip'

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
    .select('id, day_id, title, activity_time, type, notes, sort_order, place_id')
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

  async function updateActivity(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/')
    }

    const title = String(formData.get('title') || '').trim()
    const activity_time = String(formData.get('activity_time') || '').trim()
    const rawType = String(formData.get('type') || '').trim()
    const notes = String(formData.get('notes') || '').trim()
    const place_id = String(formData.get('place_id') || '').trim()

    const type: ActivityType = ACTIVITY_TYPES.some((option) => option.value === rawType)
      ? (rawType as ActivityType)
      : 'other'

    if (!title) {
      throw new Error('Title is required')
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
      throw new Error(error.message)
    }

    redirect(`/trips/${tripId}/itinerary`)
  }

  async function deleteActivity() {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/')
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('day_id', dayId)

    if (error) {
      throw new Error(error.message)
    }

    redirect(`/trips/${tripId}/itinerary`)
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
        initialTitle={activity.title}
        initialTime={activity.activity_time}
        initialType={activity.type as ActivityType}
        initialPlaceId={activity.place_id}
        initialNotes={activity.notes}
        initialPlaces={places || []}
        updateActivity={updateActivity}
        deleteActivity={deleteActivity}
        canUseFlights={flightAccess?.canAccess ?? false}
        flightAccessMessage={flightAccess ? getFlightAccessMessage(flightAccess) : 'Flight (Beta) is unavailable right now.'}
      />
    </TripPageShell>
  )
}