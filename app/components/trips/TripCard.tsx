'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import DestinationCoverArt from '@/app/components/trips/story/DestinationCoverArt'
import { buttonClass } from '@/app/components/ui/Button'
import { formatDisplayDateRange } from '@/lib/trip-storytelling'

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  cover_image?: string | null
  dayCount?: number
  momentCount?: number
  storyCount?: number
}

type TripCardProps = {
  trip: Trip
  onDeleteTrip: (formData: FormData) => Promise<void>
  canDelete: boolean
}

export default function TripCard({ trip, onDeleteTrip, canDelete }: TripCardProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const totalStories = trip.storyCount ?? 0
  const totalDays = trip.dayCount ?? 0
  const totalMoments = trip.momentCount ?? 0

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsConfirmOpen(true)
  }

  function handleConfirmDelete() {
    setIsConfirmOpen(false)
    formRef.current?.requestSubmit()
  }

  return (
    <Card interactive className="relative overflow-hidden border-slate-200 p-0">
      <div
        className="relative h-32 overflow-hidden bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(224,242,254,0.95),rgba(224,231,255,0.95))]"
        style={
          trip.cover_image
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(25,20,17,0.18),rgba(25,20,17,0.38)), url(${trip.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!trip.cover_image ? (
          <DestinationCoverArt destination={trip.destination} title={trip.title} compact />
        ) : null}
      </div>

      <div className="relative z-10 space-y-5 p-6">
        <div className="space-y-3 pr-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            <span>Your story</span>
            {totalStories > 0 ? <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] text-sky-800 ring-1 ring-sky-200">{totalStories} saved {totalStories === 1 ? 'story' : 'stories'}</span> : null}
          </div>
          <div>
            <h3 className="font-serif text-3xl text-slate-900">{trip.title}</h3>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">{trip.destination}</p>
          </div>
          <p className="text-sm text-slate-500">
            {formatDisplayDateRange(trip.start_date, trip.end_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{totalDays} {totalDays === 1 ? 'day' : 'days'} planned</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{totalMoments} {totalMoments === 1 ? 'moment' : 'moments'}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{totalStories} saved {totalStories === 1 ? 'story' : 'stories'}</span>
        </div>

        <p className="text-sm leading-7 text-slate-600">
          {totalStories > 0
            ? 'Plan with clarity. Experience with ease. Share your story.'
            : 'This journey is ready to become something memorable.'}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/trips/${trip.id}`}
            className={buttonClass({ variant: 'primary', className: 'rounded-full' })}
          >
            View story
          </Link>
          <Link
            href={`/trips/${trip.id}/itinerary`}
            className={buttonClass({ variant: 'secondary', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          >
            Continue planning
          </Link>
        </div>
      </div>

      <form ref={formRef} action={onDeleteTrip} className="relative z-20">
        <input type="hidden" name="trip_id" value={trip.id} />
        {canDelete ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="absolute bottom-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${trip.title}`}
            title="Delete story"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7 3a1 1 0 00-1 1v1H4a1 1 0 100 2h.2l.72 8.02A2 2 0 006.91 17h6.18a2 2 0 001.99-1.98L15.8 7H16a1 1 0 100-2h-2V4a1 1 0 00-1-1H7zm2 2V5h2v0H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </form>

      {isConfirmOpen ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/35 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h4 className="font-semibold text-slate-900">Delete this story?</h4>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove the trip and its related content.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className={buttonClass({ variant: 'secondary', size: 'sm', className: 'rounded-full' })}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={buttonClass({ variant: 'danger', size: 'sm', className: 'rounded-full' })}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
