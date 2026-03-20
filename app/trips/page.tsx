import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    return <div className="p-6">Failed to load trips.</div>
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-sm text-gray-500">
            Create and manage your travel plans.
          </p>
        </div>

        <Link
          href="/trips/new"
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          + Create Trip
        </Link>
      </div>

      {trips && trips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block rounded-2xl border p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 text-xl font-semibold">{trip.title}</div>
              <div className="text-sm text-gray-600">{trip.destination}</div>
              <div className="mt-3 text-sm text-gray-500">
                {trip.start_date} → {trip.end_date}
              </div>
            </Link>
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