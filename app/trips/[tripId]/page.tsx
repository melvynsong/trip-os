import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ tripId: string }>
}

export default async function TripDetailPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (error || !trip) {
    notFound()
  }

  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">{trip.destination}</p>
        <p className="text-sm text-gray-500">
          {trip.start_date} → {trip.end_date}
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="rounded-xl border px-4 py-2"
        >
          Itinerary
        </Link>
        <Link
          href={`/trips/${tripId}/places`}
          className="rounded-xl border px-4 py-2"
        >
          Places
        </Link>
        <Link
          href={`/trips/${tripId}/journal`}
          className="rounded-xl border px-4 py-2"
        >
          Journal
        </Link>
      </div>

      <div className="space-y-3">
        {days?.map((day) => (
          <div key={day.id} className="rounded-xl bg-gray-50 p-4">
            <div className="font-medium">
              Day {day.day_number}
            </div>
            <div className="text-sm text-gray-500">{day.date}</div>
          </div>
        ))}
      </div>
    </main>
  )
}