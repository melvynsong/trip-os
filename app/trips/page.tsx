import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function TripsPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch trips for this user
  let trips = []
  let error = null

  if (user) {
    const { data, error: fetchError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })

    if (fetchError) {
      error = fetchError.message
    } else {
      trips = data || []
    }
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <main className="flex-grow">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Your Trips</h1>
          <Link
            href="/trips/new"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition font-semibold"
          >
            New Trip
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            Error loading trips: {error}
          </div>
        )}

        {/* Empty state */}
        {trips.length === 0 && !error && (
          <div className="rounded-lg bg-gray-100 p-12 text-center">
            <p className="mb-6 text-lg text-gray-600">
              No trips yet. Create your first trip to get started!
            </p>
            <Link
              href="/trips/new"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition font-semibold"
            >
              Create Your First Trip
            </Link>
          </div>
        )}

        {/* Trip Cards */}
        {trips.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-lg border-l-4 border-blue-600 bg-white p-6 shadow transition hover:shadow-lg"
              >
                <h2 className="mb-2 text-2xl font-bold">{trip.title}</h2>
                <p className="text-gray-600">{trip.destination}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
