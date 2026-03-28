import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddPlaceDrawer from '@/app/components/places/picker/AddPlaceDrawer'
import GooglePlacePicker from '@/app/components/places/picker/GooglePlacePicker'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { buttonClass } from '@/app/components/ui/Button'
import { type PlaceType } from '@/lib/places'

type Props = {
  params: Promise<{ tripId: string }>
  searchParams?: Promise<{ placeType?: string }>
}

function parsePlaceType(value: string | undefined): PlaceType | undefined {
  if (!value) return undefined

  if (
    value === 'attraction' ||
    value === 'restaurant' ||
    value === 'shopping' ||
    value === 'cafe' ||
    value === 'hotel' ||
    value === 'other'
  ) {
    return value
  }

  return undefined
}

export default async function NewPlacePage({ params, searchParams }: Props) {
  const { tripId } = await params
  const parsedSearch = searchParams ? await searchParams : undefined

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
    .single()

  if (tripError || !trip) {
    notFound()
  }
  return (
    <TripPageShell className="max-w-5xl space-y-6">
      <TripHeader
        title="Save place"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}/places`}
        backLabel="Back to Places"
        actions={
          <Link
            href={`/trips/${tripId}`}
            className={buttonClass({ size: 'sm', variant: 'secondary', className: 'rounded-full' })}
          >
            Trip overview
          </Link>
        }
      />

      <div className="max-w-5xl p-1 sm:p-0">
        <GooglePlacePicker
          tripId={tripId}
          tripTitle={trip.title}
          destination={trip.destination}
          initialPlaceType={parsePlaceType(parsedSearch?.placeType)}
          afterSaveHref={`/trips/${tripId}/places`}
          saveButtonText="Save Place"
        />
      </div>

      <AddPlaceDrawer
        tripId={tripId}
        tripTitle={trip.title}
        destination={trip.destination}
        initialPlaceType={parsePlaceType(parsedSearch?.placeType)}
      />
    </TripPageShell>
  )
}
