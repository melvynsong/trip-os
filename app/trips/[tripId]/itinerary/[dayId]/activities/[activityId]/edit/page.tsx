import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonClass } from '@/app/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'
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
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Activity</h1>
        <p className="text-sm text-gray-500">
          {trip.title} · Day {day.day_number} · {day.date}
        </p>
      </div>

      <form action={updateActivity} className="space-y-4 rounded-2xl border p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            defaultValue={activity.title}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="e.g. Lunch at Tao Tao Ju"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Time</label>
          <input
            type="time"
            name="activity_time"
            defaultValue={activity.activity_time || ''}
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            name="type"
            defaultValue={activity.type || 'other'}
            className="w-full rounded-xl border px-3 py-2"
          >
            {ACTIVITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <ActivityPlacePickerField
          tripId={tripId}
          tripTitle={trip.title}
          destination={trip.destination}
          initialPlaces={places || []}
          initialSelectedPlaceId={activity.place_id}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={activity.notes || ''}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
          >
            Save Changes
          </button>

          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClass({ variant: 'secondary', className: 'rounded-xl' })}
          >
            Cancel
          </Link>
        </div>
      </form>

      <form action={deleteActivity} className="mt-4">
        <button
          type="submit"
          className={buttonClass({ variant: 'danger', className: 'rounded-xl' })}
        >
          Delete Activity
        </button>
      </form>
    </main>
  )
}