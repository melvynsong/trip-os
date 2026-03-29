'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import ActivityPlacePickerField from '@/app/components/places/picker/ActivityPlacePickerField'
import type { StoryEngineType } from '@/app/components/places/picker/StoryEngineSection'
import type { ActivityType } from '@/types/trip'

import type { ActivityActionResult } from '@/lib/trips/activity-types'
type EditActivityFormProps = {
  tripId: string
  tripTitle: string
  destination: string
  dayDate: string
  initialTitle: string
  initialTime: string | null
  initialType: ActivityType
  initialIsFlight: boolean
  initialPlaceId: string | null
  initialNotes: string | null
  initialPlaces: Array<{ id: string; name: string }>
  updateActivity: (formData: FormData) => Promise<ActivityActionResult>
  deleteActivity: () => Promise<ActivityActionResult>
  canUseFlights?: boolean
  flightAccessMessage?: string | null
}

function activityTypeToStoryType(type: ActivityType, isFlight: boolean): StoryEngineType {
  switch (type) {
    case 'transport':
      return isFlight ? 'flight' : 'other'
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
  initialIsFlight,
  initialPlaceId,
  initialNotes,
  initialPlaces,
  updateActivity,
  deleteActivity,
  canUseFlights = true,
  flightAccessMessage,
}: EditActivityFormProps) {
  const [storyType, setStoryType] = useState<StoryEngineType>(activityTypeToStoryType(initialType, initialIsFlight))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
      const result = await updateActivity(formData)
      if (result.ok) {
        if (result.redirect) {
          window.location.href = result.redirect
        } else {
          window.location.href = `/trips/${tripId}/itinerary`
        }
        return
      } else {
        setError(result.error)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteActivity()
      if (result.ok) {
        if (result.redirect) {
          window.location.href = result.redirect
        } else {
          window.location.href = `/trips/${tripId}/itinerary`
        }
        return
      } else {
        setError(result.error)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
    } finally {
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
            required={!isFlightMode}
            defaultValue={initialTitle}
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
            defaultValue={initialTime || ''}
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
            disabled={isSubmitting || isFlightMode}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting || isDeleting || isFlightMode}
            className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
          >
            {isSubmitting ? 'Saving...' : isFlightMode ? 'Done' : 'Save Changes'}
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
