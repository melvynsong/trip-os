'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buttonClass } from '@/app/components/ui/Button'
import {
  type AiGeneratedItinerary,
  type AiTripContext,
  type AiTripDayContext,
} from '@/lib/ai/itinerary'

type AiItineraryGeneratorProps = {
  tripId: string
  trip: AiTripContext
  days: AiTripDayContext[]
  existingActivityCount: number
}

export default function AiItineraryGenerator({
  tripId,
  trip,
  days,
  existingActivityCount,
}: AiItineraryGeneratorProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<AiGeneratedItinerary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const totalGeneratedActivities = useMemo(
    () => draft?.days.reduce((sum, day) => sum + day.activities.length, 0) || 0,
    [draft]
  )

  const handleGenerate = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/ai-itinerary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate itinerary.')
      }

      setDraft(payload.draft)
    } catch (err) {
      setDraft(null)
      setError(err instanceof Error ? err.message : 'Failed to generate itinerary.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!draft) {
      return
    }

    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/ai-itinerary/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ draft }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save itinerary.')
      }

      setSuccessMessage(`Saved ${payload.insertedCount} generated activities to your itinerary.`)
      router.push(`/trips/${tripId}/itinerary`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save itinerary.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Describe the trip you want</h2>
          <p className="mt-1 text-sm text-gray-500">
            The AI will use {trip.destination}, your trip dates, and the existing {days.length}-day structure.
          </p>
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="e.g. 3 days in Guangzhou focused on food and shopping, relaxed pace, local experiences"
        />

        <div className="mt-3 text-sm text-gray-500">
          Saving will append generated activities and will not remove existing ones.
        </div>

        {existingActivityCount > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This trip already has {existingActivityCount} activities. AI save will append new draft activities after the existing ones.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
          >
            {isGenerating ? 'Generating...' : 'Generate Draft'}
          </button>
        </div>
      </div>

      {draft ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Draft Preview</h2>
              <p className="text-sm text-gray-500">
                {totalGeneratedActivities} activities generated across {draft.days.length} days.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={buttonClass({ variant: 'primary', className: 'rounded-xl' })}
            >
              {isSaving ? 'Saving...' : 'Save to Itinerary'}
            </button>
          </div>
          <div className="space-y-3">
            {draft.days.map((draftDay, index) => {
              const actualDay = days[index]
              return (
                <div key={draftDay.day_number} className="rounded-2xl border p-5">
                  <div className="mb-3">
                    <div className="font-semibold text-lg">
                      Day {draftDay.day_number} — {draftDay.title}
                    </div>
                    <div className="text-sm text-gray-500">{actualDay?.date || 'No date'}</div>
                  </div>
                  {draftDay.activities.length > 0 ? (
                    <div className="space-y-3">
                      {draftDay.activities.map((activity, activityIndex) => (
                        <div
                          key={`${draftDay.day_number}-${activityIndex}`}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-xs text-gray-500">
                                {activity.activity_time ? `Time: ${activity.activity_time}` : 'No time'} | Type: {activity.type}
                              </div>
                              {activity.notes && (
                                <div className="text-xs text-gray-600 mt-1">{activity.notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">No activities for this day.</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}