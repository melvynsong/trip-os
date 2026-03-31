import { GeneratePackingListButton } from '@/components/itinerary/GeneratePackingListButton'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonClass } from '@/app/components/ui/Button'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { getPackingAccessState } from '@/lib/feature-toggles'
import PackingGenerator from '@/app/components/trips/packing/PackingGenerator'

// Lightweight placeholder state for incomplete logic
export default async function PackingListPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('id', tripId)
    .single()
  if (tripError || !trip) {
    return (
      <TripPageShell>
        <TripHeader title="Packing List" subtitle="Based on your trip itinerary" backHref={`/trips/${tripId}`} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Trip not found or you do not have access.
        </div>
      </TripPageShell>
    )
  }
  return (
    <TripPageShell className="max-w-3xl space-y-6">
      <TripHeader
        dateRange={`${trip.start_date} → ${trip.end_date}`}
        title="Packing List"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}`} backLabel="Back to Trip"
      />
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-slate-500 text-center">
        Packing list generation is being prepared.
      </div>
      <div className="mt-6">
        <GeneratePackingListButton tripId={tripId} />
      </div>
    </TripPageShell>
  )
}
