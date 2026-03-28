'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'
import ActivityFlightInput from '@/app/components/itinerary/ActivityFlightInput'
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

type NewActivityFormProps = {
  tripId: string
  dayId: string
  tripTitle: string
  destination: string
  flightDate: string
  initialPlaces: Array<{ id: string; name: string }>
  createActivity: (formData: FormData) => Promise<void>
}

export default function NewActivityForm({
  tripId,
  dayId,
  tripTitle,
  destination,
  flightDate,
  initialPlaces,
  createActivity,
}: NewActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>('other')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createActivity(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          name="title"
          required
          className="w-full rounded-xl border px-3 py-2"
          placeholder="e.g. Lunch at Tao Tao Ju"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Time</label>
        <input
          type="time"
          name="activity_time"
          className="w-full rounded-xl border px-3 py-2"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Type</label>
        <select
          name="type"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as ActivityType)}
          className="w-full rounded-xl border px-3 py-2"
          disabled={isSubmitting}
        >
          {ACTIVITY_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {activityType === 'transport' && (
        <ActivityFlightInput tripId={tripId} flightDate={flightDate} />
      )}

      <ActivityPlacePickerField
        tripId={tripId}
        tripTitle={tripTitle}
        destination={destination}
        initialPlaces={initialPlaces}
        initialSelectedPlaceId={null}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Optional notes..."
          disabled={isSubmitting}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
        >
          {isSubmitting ? 'Saving...' : 'Save Activity'}
        </button>

        <Link
          href={`/trips/${tripId}/itinerary`}
          className={buttonClass({
            variant: 'secondary',
            className: `rounded-xl ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`,
          })}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
