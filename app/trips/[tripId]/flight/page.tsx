import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonClass } from '@/app/components/ui/Button'
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-5">
        <Link
          href={`/trips/${tripId}`}
          className={buttonClass({
            size: 'sm',
            variant: 'ghost',
            className: 'rounded-full text-[var(--text-strong)] hover:bg-[var(--brand-primary-soft)]',
          })}
        >
          ← {trip.title}
        </Link>
      </div>

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
    </main>
  )
}
