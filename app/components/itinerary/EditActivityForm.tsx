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

type EditActivityFormProps = {
  tripId: string
  tripTitle: string
  destination: string
  dayDate: string
  initialTitle: string
  initialTime: string | null
  initialType: ActivityType
  initialPlaceId: string | null
  initialNotes: string | null
  initialPlaces: Array<{ id: string; name: string }>
  updateActivity: (formData: FormData) => Promise<void>
  deleteActivity: () => Promise<void>
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

export default function EditActivityForm({
  tripId,
  tripTitle,
  destination,
  dayDate,
  initialTitle,
  initialTime,
  initialType,
  initialPlaceId,
  initialNotes,
  initialPlaces,
  updateActivity,
  deleteActivity,
  canUseFlights = true,
  flightAccessMessage,
}: EditActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>(initialType)
  const [storyType, setStoryType] = useState<StoryEngineType>(activityTypeToStoryType(initialType))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
      await updateActivity(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity')
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteActivity()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            defaultValue={initialTitle}
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
            defaultValue={initialTime || ''}
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
            flightDate={dayDate}
          initialPlaces={initialPlaces}
          initialSelectedPlaceId={initialPlaceId}
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
            defaultValue={initialNotes || ''}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Optional notes..."
            disabled={isSubmitting}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>

          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClass({
              variant: 'secondary',
              className: `rounded-xl ${isSubmitting || isDeleting ? 'opacity-50 pointer-events-none' : ''}`,
            })}
          >
            Cancel
          </Link>
        </div>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); handleDelete() }} className="mt-4">
        <button
          type="submit"
          disabled={isDeleting || isSubmitting}
          className={buttonClass({ variant: 'danger', className: 'rounded-xl' })}
        >
          {isDeleting ? 'Deleting...' : 'Delete Activity'}
        </button>
      </form>
    </>
  )
}
