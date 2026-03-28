import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewActivityForm from '@/app/components/itinerary/NewActivityForm'
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

  async function createActivity(formData: FormData) {
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

    if (!title) {
      throw new Error('Title is required')
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
      throw new Error(error.message)
    }

    redirect(`/trips/${tripId}/itinerary`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Activity</h1>
        <p className="text-sm text-gray-500">
          {trip.title} · Day {day.day_number} · {day.date}
        </p>
      </div>

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
    </main>
  )
}