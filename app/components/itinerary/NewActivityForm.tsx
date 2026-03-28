'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'
import type { StoryEngineType } from '@/app/components/places/picker/StoryEngineSection'
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
  tripTitle: string
  destination: string
  flightDate: string
  initialPlaces: Array<{ id: string; name: string }>
  createActivity: (formData: FormData) => Promise<void>
  canUseFlights?: boolean
  flightAccessMessage?: string | null
}

function activityTypeToStoryType(type: ActivityType): StoryEngineType {
  switch (type) {
    case 'transport':
      return 'flight'
    case 'food':
      return 'restaurant'
    case 'shopping':
      return 'shopping'
    case 'hotel':
      return 'hotel'
    case 'attraction':
      return 'attraction'
    case 'note':
    case 'other':
    default:
      return 'other'
  }
}

function storyTypeToActivityType(type: StoryEngineType): ActivityType {
  switch (type) {
    case 'flight':
      return 'transport'
    case 'restaurant':
    case 'cafe':
      return 'food'
    case 'shopping':
      return 'shopping'
    case 'hotel':
      return 'hotel'
    case 'attraction':
      return 'attraction'
    case 'other':
    default:
      return 'other'
  }
}

export default function NewActivityForm({
  tripId,
  tripTitle,
  destination,
  flightDate,
  initialPlaces,
  createActivity,
  canUseFlights = true,
  flightAccessMessage,
}: NewActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>('other')
  const [storyType, setStoryType] = useState<StoryEngineType>(activityTypeToStoryType('other'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleActivityTypeChange(nextType: ActivityType) {
    setActivityType(nextType)
    setStoryType(activityTypeToStoryType(nextType))
  }

  function handleStoryTypeChange(nextType: StoryEngineType) {
    setStoryType(nextType)
    setActivityType(storyTypeToActivityType(nextType))
  }

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
          onChange={(e) => handleActivityTypeChange(e.target.value as ActivityType)}
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

      <ActivityPlacePickerField
        tripId={tripId}
        tripTitle={tripTitle}
        destination={destination}
        flightDate={flightDate}
        initialPlaces={initialPlaces}
        initialSelectedPlaceId={null}
        selectedStoryType={storyType}
        onStoryTypeChange={handleStoryTypeChange}
        canUseFlights={canUseFlights}
        flightAccessMessage={flightAccessMessage}
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
