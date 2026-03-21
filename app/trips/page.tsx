import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/app/components/shared/PageHeader'
import TripCard from '@/app/components/trips/TripCard'
import EmptyState from '@/app/components/ui/EmptyState'
import { buttonClass } from '@/app/components/ui/Button'
import { Trip as TripType } from '@/types/trip'

type TripListItem = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

export default async function TripsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .order('start_date', { ascending: true })
    .returns<TripListItem[]>()

  if (error) {
    return <div className="p-6">Failed to load trips.</div>
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="My Trips"
        subtitle="Create and manage your travel plans."
        actions={
          <Link
            href="/trips/new"
            className={buttonClass({ variant: 'primary' })}
          >
            + Create Trip
          </Link>
        }
      />

      {trips && trips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No trips yet"
          description="Create your first trip to start planning your itinerary."
        />
      )}
    </main>
  )
}