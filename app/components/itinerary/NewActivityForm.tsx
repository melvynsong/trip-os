'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'
import type { StoryEngineType } from '@/app/components/places/picker/StoryEngineSection'
import type { ActivityType } from '@/types/trip'

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
  const [storyType, setStoryType] = useState<StoryEngineType>('other')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFlightMode = storyType === 'flight'

  function handleStoryTypeChange(nextType: StoryEngineType) {
    setStoryType(nextType)
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
          required={!isFlightMode}
          className="w-full rounded-xl border px-3 py-2"
          placeholder={isFlightMode ? 'Derived from selected flight details' : 'e.g. Lunch at Tao Tao Ju'}
          disabled={isSubmitting || isFlightMode}
        />
        {isFlightMode ? (
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            For flights, title and timing are taken from the selected departure and arrival details.
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Time</label>
        <input
          type="time"
          name="activity_time"
          className="w-full rounded-xl border px-3 py-2"
          disabled={isSubmitting || isFlightMode}
        />
      </div>

      <input type="hidden" name="type" value={storyTypeToActivityType(storyType)} />
      <input type="hidden" name="flight_mode" value={isFlightMode ? '1' : '0'} />

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
          {isSubmitting ? 'Saving...' : isFlightMode ? 'Done' : 'Save Activity'}
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
