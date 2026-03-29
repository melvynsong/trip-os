import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { listTripFlights, saveUnifiedTripFlight, deleteUnifiedTripFlight } from '@/lib/flights/trip'
import type { FlightActivity } from '@/lib/trips/flight-activity'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

type SaveFlightPayload = {
  flight?: unknown
}

function parseFlight(input: unknown): FlightActivity | null {
  if (typeof input !== 'object' || input === null) return null
  return input as FlightActivity
}

async function verifyTripOwnership(tripId: string, userId: string) {
  const supabase = await createClient()
  const { data: trip, error } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single()

  if (error || !trip) {
    return null
  }

  return { supabase, trip }
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { tripId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const access = await getCurrentUserFlightAccessState().catch(() => null)
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 })
    }

    const ownedTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownedTrip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const flights = await listTripFlights(ownedTrip.supabase, tripId)
    return NextResponse.json({ flights })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { tripId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const access = await getCurrentUserFlightAccessState().catch(() => null)
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 })
    }

    const ownedTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownedTrip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json().catch(() => null)) as SaveFlightPayload | null
    const flight = parseFlight(body?.flight)
    if (!flight) {
      return NextResponse.json({ error: 'Flight data is required.' }, { status: 400 })
    }
    // Insert the unified flight activity
    const savedFlight = await saveUnifiedTripFlight({
      supabase: ownedTrip.supabase,
      tripId,
      flight,
    })
    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/flight`)
    revalidatePath(`/trips/${tripId}/itinerary`)
    return NextResponse.json({ flight: savedFlight })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}

type DeleteFlightPayload = {
  id?: string
}



  try {
    const { tripId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const access = await getCurrentUserFlightAccessState().catch(() => null)
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 })
    }

    const ownedTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownedTrip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json().catch(() => null)) as DeleteFlightPayload | null
    const id = body?.id
    if (!id) {
      return NextResponse.json({ error: 'Flight id is required.' }, { status: 400 })
    }
    await deleteUnifiedTripFlight({
      supabase: ownedTrip.supabase,
      tripId,
      id,
    })
    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/flight`)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
