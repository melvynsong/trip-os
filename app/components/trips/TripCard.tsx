'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
}

type TripCardProps = {
  trip: Trip
  onDeleteTrip: (formData: FormData) => Promise<void>
}

export default function TripCard({ trip, onDeleteTrip }: TripCardProps) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    const ok = confirm('Delete this trip? This will remove all days, activities, and places.')
    if (!ok) return

    formRef.current?.requestSubmit()
  }

  return (
    <Card className="relative p-5">
      <Link
        href={`/trips/${trip.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${trip.title}`}
      />

      <div className="pointer-events-none relative z-10 pr-8">
        <div className="mb-2 text-xl font-semibold">{trip.title}</div>
        <div className="text-sm text-gray-600">{trip.destination}</div>
        <div className="mt-3 text-sm text-gray-500">
          {trip.start_date} → {trip.end_date}
        </div>
      </div>

      <form ref={formRef} action={onDeleteTrip} className="relative z-20">
        <input type="hidden" name="trip_id" value={trip.id} />
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-gray-400/80 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${trip.title}`}
          title="Delete trip"
        >
          🗑️
        </button>
      </form>
    </Card>
  )
}
