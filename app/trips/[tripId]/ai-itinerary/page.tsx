import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/app/components/shared/PageHeader'
import AiItineraryGenerator from '@/app/components/ai/AiItineraryGenerator'
import type { AiTripContext, AiTripDayContext } from '@/lib/ai/itinerary'

type Props = {
  params: Promise<{ tripId: string }>
}

export default async function AiItineraryPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('title, destination, start_date, end_date')
    .eq('id', tripId)
    .single<AiTripContext>()

  if (tripError || !trip) {
    notFound()
  }

  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id, day_number, date, title')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .returns<AiTripDayContext[]>()

  if (daysError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load trip days: {daysError.message}
        </div>
      </main>
    )
  }

  const existingActivityCount =
    days && days.length > 0
      ? (
          await supabase
            .from('activities')
            .select('id', { count: 'exact', head: true })
            .in('day_id', days.map((day) => day.id))
        ).count || 0
      : 0

  return (
    <main className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="AI Generate Itinerary"
        subtitle={`${trip.title} · ${trip.destination} · ${trip.start_date} → ${trip.end_date}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href={`/trips/${tripId}`} className="rounded-xl border px-4 py-2">
              ← Back to Trip
            </Link>
            <Link
              href={`/trips/${tripId}/itinerary`}
              className="rounded-xl border px-4 py-2"
            >
              View Itinerary
            </Link>
          </div>
        }
      />

      {days && days.length > 0 ? (
        <AiItineraryGenerator
          tripId={tripId}
          trip={trip}
          days={days}
          existingActivityCount={existingActivityCount}
        />
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
          This trip does not have any itinerary days yet, so there is nowhere to save a generated draft.
        </div>
      )}
    </main>
  )
}
