import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserEntitlements } from '@/lib/membership/server'
import { PREMIUM_FIND_PLACE_TIERS, hasAccess } from '@/lib/membership/access'
import type { MembershipTier } from '@/lib/membership/types'
import { createClient } from '@/lib/supabase/server'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'

function activityTypeToPlaceType(type: string) {
  switch (type) {
    case 'food':
      return 'restaurant' as const
    case 'attraction':
      return 'attraction' as const
    case 'shopping':
      return 'shopping' as const
    case 'hotel':
      return 'hotel' as const
    default:
      return 'other' as const
  }
}

type Props = {
  params: Promise<{
    tripId: string
    dayId: string
    activityId: string
  }>
}

export default async function EditActivityPage({ params }: Props) {
  const { tripId, dayId, activityId } = await params
  let userTier: MembershipTier
  try {
    const entitlements = await getCurrentUserEntitlements()
    userTier = entitlements.tier
  } catch {
    redirect('/')
  }

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

  const isPremiumUser = hasAccess(userTier, PREMIUM_FIND_PLACE_TIERS)

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
    const type = String(formData.get('type') || 'other').trim()
    const notes = String(formData.get('notes') || '').trim()
    const place_id = String(formData.get('place_id') || '').trim()

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

        {!isPremiumUser ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              name="type"
              defaultValue={activity.type}
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
        ) : null}

        <ActivityPlacePickerField
          tripId={tripId}
          destination={trip.destination}
          initialPlaces={places || []}
          initialSelectedPlaceId={activity.place_id}
          initialPlaceType={activityTypeToPlaceType(activity.type)}
          userTier={userTier}
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
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Save Changes
          </button>

          <Link
            href={`/trips/${tripId}/itinerary`}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>

      <form action={deleteActivity} className="mt-4">
        <button
          type="submit"
          className="rounded-xl border border-red-300 px-4 py-2 text-red-600"
        >
          Delete Activity
        </button>
      </form>
    </main>
  )
}