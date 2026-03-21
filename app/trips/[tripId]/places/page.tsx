import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlaceCard from '@/app/components/places/PlaceCard'
import PageHeader from '@/app/components/shared/PageHeader'
import { Trip as TripType, Place as PlaceType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination'>

type Place = Pick<
  PlaceType,
  'id' | 'trip_id' | 'name' | 'category' | 'address' | 'notes'
>

export default async function PlacesPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination')
    .eq('id', tripId)
    .single<Trip>()

  if (tripError || !trip) {
    notFound()
  }

  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('id, trip_id, name, category, address, notes')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    .returns<Place[]>()

  if (placesError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load places: {placesError.message}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <PageHeader
        title={trip.title}
        subtitle={`${trip.destination} · Saved Places`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href={`/trips/${tripId}`} className="rounded-xl border px-4 py-2">
              ← Back to Trip
            </Link>
            <Link
              href={`/trips/${tripId}/places/new`}
              className="rounded-xl bg-black px-4 py-2 text-white"
            >
              + Save Place
            </Link>
          </div>
        }
      />

      {places && places.length > 0 ? (
        <div className="space-y-4">
          {places.map((place) => (
            <PlaceCard key={place.id} tripId={tripId} place={place} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          No saved places yet. Add one to get started.
        </div>
      )}
    </main>
  )
}
