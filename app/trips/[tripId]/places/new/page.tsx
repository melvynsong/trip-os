import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddPlaceDrawer from '@/app/components/places/picker/AddPlaceDrawer'
import { Trip as TripType } from '@/types/trip'
import { type PlaceType } from '@/lib/places'

type Props = {
  params: Promise<{ tripId: string }>
  searchParams?: Promise<{ placeType?: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination'>

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
    <main>
      <AddPlaceDrawer
        tripId={tripId}
        tripTitle={trip.title}
        destination={trip.destination}
        initialPlaceType={parsePlaceType(parsedSearch?.placeType)}
      />
    </main>
  )
}
