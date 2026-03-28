import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AiItineraryGenerator from '@/app/components/ai/AiItineraryGenerator'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { buttonClass } from '@/app/components/ui/Button'
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
    redirect('/')
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
      <TripPageShell className="max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load trip days: {daysError.message}
        </div>
      </TripPageShell>
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
    <TripPageShell className="max-w-5xl space-y-6">
      <TripHeader
        dateRange={`${trip.start_date} → ${trip.end_date}`}
        title="AI Generate Itinerary"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}`}
        backLabel="Back to Trip"
        actions={
          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClass({ size: 'sm', variant: 'secondary', className: 'rounded-full' })}
          >
            View itinerary
          </Link>
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
    </TripPageShell>
  )
}
