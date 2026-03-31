import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { getPackingAccessState } from '@/lib/feature-toggles'
import PackingGenerator from '@/app/components/trips/packing/PackingGenerator'

// Lightweight placeholder state for incomplete logic
export default async function PackingListPage({ params }: { params: { tripId: string } } | { params: Promise<{ tripId: string }> }) {
  // Support both direct object and Promise for params
  let tripId: string | undefined
  if (typeof params === 'object' && 'then' in params && typeof params.then === 'function') {
    // It's a Promise
    const resolved = await params
    tripId = resolved?.tripId
  } else {
    tripId = (params as { tripId?: string })?.tripId
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  let trip = null, tripError = null
  if (tripId) {
    const result = await supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()
    trip = result.data
    tripError = result.error
  }
  // Membership and access check (copied from /packing)
  let membership
  try {
    membership = await getCurrentUserMembership()
  } catch {
    redirect('/')
  }
  const packingAccess = await getPackingAccessState(membership.tier)
  const canUsePacking = packingAccess.canAccess
  // Weather context (copied from /packing)
  let weatherContext = null
  if (canUsePacking && trip) {
    // Import resolveWeatherContext from /packing/page.tsx
    const { resolveWeatherContext } = await import('../packing/page')
    try {
      weatherContext = await resolveWeatherContext(trip.destination, trip.start_date, trip.end_date)
    } catch {
      weatherContext = null
    }
  }
  if (tripError || !trip) {
    return (
      <TripPageShell>
        <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
          <strong>Debug Info:</strong>
          <ul className="mt-1 space-y-1">
            <li><b>tripId:</b> {String(tripId)}</li>
            <li><b>User:</b> {user?.id || 'none (not logged in)'}</li>
          </ul>
        </div>
        <TripHeader title="Packing List" subtitle="Based on your trip itinerary" backHref={tripId ? `/trips/${tripId}` : "/trips"} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Trip not found or you do not have access.
        </div>
      </TripPageShell>
    )
  }
  return (
    <TripPageShell className="max-w-3xl space-y-6">
      {/* Debug Info removed for production */}
      <TripHeader
        dateRange={`${trip.start_date} → ${trip.end_date}`}
        title="Packing List"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}`}
        backLabel="Back to Trip"
      />
      {canUsePacking ? (
        <PackingGenerator
          tripId={tripId}
          tripTitle={trip.title}
          destination={trip.destination}
          weatherContext={weatherContext}
        />
      ) : (
        <div className="rounded-[2rem] border border-[var(--border-soft)] bg-white p-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Packing <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
          </p>
          <h1 className="text-2xl font-serif text-[var(--text-strong)]">
            {packingAccess.hasRequiredTier ? 'Temporarily unavailable' : 'Available for Friends'}
          </h1>
          <p className="text-sm leading-7 text-[var(--text-subtle)] max-w-md mx-auto">
            {packingAccess.hasRequiredTier
              ? 'Packing is temporarily unavailable for your tier.'
              : 'Packing is available for Friend and Owner members.'}
          </p>
        </div>
      )}
    </TripPageShell>
  )
}
