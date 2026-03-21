import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddPlaceDrawer from '@/app/components/places/picker/AddPlaceDrawer'
import { Trip as TripType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination'>

export default async function NewPlacePage({ params }: Props) {
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
      />
    </main>
  )
}
