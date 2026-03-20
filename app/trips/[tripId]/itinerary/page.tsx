import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ tripId: string }>
}

export default async function ItineraryPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get trip
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (!trip) {
    notFound()
  }

  // Get days
  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">{trip.destination}</p>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {days?.map((day) => (
          <div key={day.id} className="rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  Day {day.day_number}
                </div>
                <div className="text-sm text-gray-500">
                  {day.date}
                </div>
              </div>

              <button className="rounded-lg border px-3 py-1 text-sm">
                + Add Activity
              </button>
            </div>

            {/* Placeholder */}
            <div className="text-sm text-gray-400">
              No activities yet
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}