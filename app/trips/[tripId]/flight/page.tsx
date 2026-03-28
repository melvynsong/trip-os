import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonClass } from '@/app/components/ui/Button'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import FlightPlanner from '@/app/components/trips/flight/FlightPlanner'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { listTripFlights } from '@/lib/flights/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

export default async function FlightPage({ params }: Props) {
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
    .select('id, title, destination, start_date, end_date')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single<{ id: string; title: string; destination: string; start_date: string; end_date: string }>()

  if (tripError || !trip) {
    notFound()
  }

  const access = await getCurrentUserFlightAccessState().catch(() => null)
  if (!access) {
    redirect('/')
  }

  const savedFlights = access.canAccess ? await listTripFlights(supabase, tripId) : []

  return (
    <TripPageShell className="max-w-5xl space-y-6">
      <TripHeader
        dateRange={`${trip.start_date} → ${trip.end_date}`}
        title="Add Flight"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}`}
        backLabel="Back to Trip"
      />

      {access.canAccess ? (
        <FlightPlanner
          tripId={tripId}
          tripTitle={trip.title}
          startDate={trip.start_date}
          endDate={trip.end_date}
          initialSavedFlights={savedFlights}
        />
      ) : (
        <div className="rounded-[2rem] border border-[var(--border-soft)] bg-white p-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Add Flight <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
          </p>
          <h1 className="text-2xl font-serif text-[var(--text-strong)]">
            {access.hasRequiredTier ? 'Temporarily unavailable' : 'Available for Friends'}
          </h1>
          <p className="mx-auto max-w-md text-sm leading-7 text-[var(--text-subtle)]">
            {getFlightAccessMessage(access)}
          </p>
          <Link
            href="/trips"
            className={buttonClass({
              variant: 'secondary',
              className: 'rounded-full',
            })}
          >
            Back to trips
          </Link>
        </div>
      )}
    </TripPageShell>
  )
}
