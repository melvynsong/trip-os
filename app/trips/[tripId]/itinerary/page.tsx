import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ tripId: string }>
}

export default async function ItineraryPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  // Check user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    notFound()
  }

  // Get days + activities
  const { data: days, error: daysError } = await supabase
    .from('days')
    .select(`
      *,
      activities (*)
    `)
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  if (daysError) {
    return <div className="p-6">Failed to load itinerary.</div>
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">{trip.destination}</p>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {days?.map((day) => {
          const activities = [...(day.activities || [])].sort((a, b) => {
            const timeA = a.activity_time || '99:99:99'
            const timeB = b.activity_time || '99:99:99'

            if (timeA !== timeB) {
              return timeA.localeCompare(timeB)
            }

            return a.sort_order - b.sort_order
          })

          return (
            <div key={day.id} className="rounded-2xl border p-5">
              {/* Day Header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    Day {day.day_number}
                  </div>
                  <div className="text-sm text-gray-500">
                    {day.date}
                  </div>
                </div>

                <Link
                  href={`/trips/${tripId}/itinerary/${day.id}/new`}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  + Add Activity
                </Link>
              </div>

              {/* Activities */}
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.activity_time || 'No time'}
                        </div>
                      </div>

                      <div className="mt-1 text-sm text-gray-500 capitalize">
                        {activity.type}
                      </div>

                      {activity.notes ? (
                        <div className="mt-2 text-sm text-gray-700">
                          {activity.notes}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  No activities yet
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}