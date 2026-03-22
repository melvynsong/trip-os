import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'

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
    .select('id, title, destination')
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
    const type = String(formData.get('type') || 'other').trim()
    const notes = String(formData.get('notes') || '').trim()
    const place_id = String(formData.get('place_id') || '').trim()

    if (!title) {
      throw new Error('Title is required')
    }

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

      <form action={createActivity} className="space-y-4 rounded-2xl border p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            className="w-full rounded-xl border px-3 py-2"
            placeholder="e.g. Lunch at Tao Tao Ju"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Time</label>
          <input
            type="time"
            name="activity_time"
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            name="type"
            defaultValue="other"
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="food">Food</option>
            <option value="attraction">Attraction</option>
            <option value="shopping">Shopping</option>
            <option value="transport">Transport</option>
            <option value="hotel">Hotel</option>
            <option value="note">Note</option>
            <option value="other">Other</option>
          </select>
        </div>

        <ActivityPlacePickerField
          tripId={tripId}
          destination={trip.destination}
          initialPlaces={places || []}
          initialSelectedPlaceId={null}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Save Activity
          </button>

          <Link
            href={`/trips/${tripId}/itinerary`}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}