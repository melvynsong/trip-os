import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewActivityForm from '@/app/components/itinerary/NewActivityForm'
import type { ActivityActionResult } from '@/lib/trips/activity-types'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import type { ActivityType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string; dayId: string }>
}

export default async function NewActivityPage({ params }: Props) {
  const { tripId, dayId } = await params

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
    .single()

  if (tripError || !trip) {
    notFound()
  }

  const { data: day, error: dayError } = await supabase
    .from('days')
    .select('id, day_number, date, trip_id')
    .eq('id', dayId)
    .eq('trip_id', tripId)
    .single()

  if (dayError || !day) {
    notFound()
  }
  const { data: places } = await supabase
    .from('places')
    .select('id, name')
    .eq('trip_id', tripId)
    .order('name', { ascending: true })

  const flightAccess = await getCurrentUserFlightAccessState().catch(() => null)

  async function createActivity(formData: FormData): Promise<ActivityActionResult> {
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

    if (!title) {
      return { ok: false, error: 'Title is required' }
    }

    const ACTIVITY_TYPES: ActivityType[] = ['food', 'attraction', 'shopping', 'transport', 'hotel', 'note', 'other']
    const type: ActivityType = ACTIVITY_TYPES.includes(rawType as ActivityType)
      ? (rawType as ActivityType)
      : 'other'

    const { error } = await supabase.from('activities').insert({
      day_id: dayId,
      title,
      activity_time: activity_time || null,
      type,
      notes: notes || null,
      place_id: place_id || null,
      status: 'planned',
      sort_order: 0,
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  return (
    <TripPageShell className="max-w-2xl space-y-6">
      <TripHeader
        dateRange={day.date}
        title="Add activity"
        subtitle={`${trip.title} · Day ${day.day_number}`}
        backHref={`/trips/${tripId}/itinerary`}
        backLabel="Back to Itinerary"
      />

      <NewActivityForm
        tripId={tripId}
        tripTitle={trip.title}
        destination={trip.destination}
        flightDate={day.date}
        initialPlaces={places || []}
        createActivity={createActivity}
        canUseFlights={flightAccess?.canAccess ?? false}
        flightAccessMessage={flightAccess ? getFlightAccessMessage(flightAccess) : 'Flight (Beta) is unavailable right now.'}
      />
    </TripPageShell>
  )
}