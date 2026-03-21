import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/app/components/shared/PageHeader'
import TripCard from '@/app/components/trips/TripCard'
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
            className="rounded-xl bg-black px-4 py-2 text-white"
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
        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          No trips yet. Create your first one.
        </div>
      )}
    </main>
  )
}