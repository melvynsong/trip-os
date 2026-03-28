import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlaceCard from '@/app/components/places/PlaceCard'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import EmptyState from '@/app/components/ui/EmptyState'
import { buttonClass } from '@/app/components/ui/Button'
import { Trip as TripType, Place as PlaceType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination'>

type Place = Pick<
  PlaceType,
  | 'id'
  | 'trip_id'
  | 'name'
  | 'category'
  | 'place_type'
  | 'address'
  | 'city'
  | 'country'
  | 'latitude'
  | 'longitude'
  | 'external_place_id'
  | 'source'
  | 'notes'
  | 'visited'
>

export default async function PlacesPage({ params }: Props) {
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
    .select('id, title, destination')
    .eq('id', tripId)
    .single<Trip>()

  if (tripError || !trip) {
    notFound()
  }

  const { data: places, error: placesError } = await supabase
    .from('places')
    .select(
      'id, trip_id, name, category, place_type, address, city, country, latitude, longitude, external_place_id, source, notes, visited'
    )
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    .returns<Place[]>()

  if (placesError) {
    return (
      <TripPageShell className="max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load places: {placesError.message}
        </div>
      </TripPageShell>
    )
  }

  return (
    <TripPageShell className="max-w-5xl space-y-6">
      <TripHeader
        title={trip.title}
        subtitle={`${trip.destination} · Saved places`}
        backHref={`/trips/${tripId}`}
        backLabel="Back to Trip"
        actions={
          <Link
            href={`/trips/${tripId}/places/new`}
            className={buttonClass({ variant: 'primary', size: 'sm', className: 'rounded-full' })}
          >
            + Save place
          </Link>
        }
      />

      {places && places.length > 0 ? (
        <div className="space-y-4">
          {places.map((place) => (
            <PlaceCard key={place.id} tripId={tripId} place={place} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved places yet"
          description="Save places to build a richer itinerary and story memory feed."
        />
      )}
    </TripPageShell>
  )
}
