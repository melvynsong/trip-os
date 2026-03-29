import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { listTripFlights, saveTripFlightSelection, deleteTripFlight } from '@/lib/flights/trip'
import { mapFlightToActivities } from '@/lib/trips/flight-activity'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

type SaveFlightPayload = {
  direction?: unknown
  flight?: unknown
}

function parseDirection(input: unknown): FlightDirection | null {
  return input === 'return' || input === 'outbound' || input === 'unknown'
    ? input
    : null
}

function parseFlight(input: unknown): FlightLookupResult | null {
  if (typeof input !== 'object' || input === null) return null
  return input as FlightLookupResult
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
    const direction = parseDirection(body?.direction)
    const flight = parseFlight(body?.flight)

    if (!direction || !flight) {
      return NextResponse.json({ error: 'Direction and looked up flight are required.' }, { status: 400 })
    }

    const savedFlight = await saveTripFlightSelection({
      supabase: ownedTrip.supabase,
      tripId,
      direction,
      flight,
    })

    // Fetch all days for the trip
    const { data: days } = await ownedTrip.supabase
      .from('days')
      .select('id, date')
      .eq('trip_id', tripId)
    const dayIdMap = Object.fromEntries((days || []).map((d: any) => [d.date, d.id]))

    // Map flight to activities
    const [departureActivity, arrivalActivity] = mapFlightToActivities(savedFlight, dayIdMap)

    // Debug logs for mapping and activities
    console.log('dayIdMap:', dayIdMap);
    console.log('departureActivity:', departureActivity);
    console.log('arrivalActivity:', arrivalActivity);

    // Insert both activities
    const { error: depErr } = await ownedTrip.supabase.from('activities').insert({
      ...departureActivity,
      status: 'planned',
    })
    const { error: arrErr } = await ownedTrip.supabase.from('activities').insert({
      ...arrivalActivity,
      status: 'planned',
    })
    if (depErr || arrErr) {
      return NextResponse.json({ error: 'Failed to create flight activities.' }, { status: 500 })
    }

    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/flight`)
    revalidatePath(`/trips/${tripId}/itinerary`)

    return NextResponse.json({ flight: savedFlight, activities: [departureActivity, arrivalActivity] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}

type DeleteFlightPayload = {
  direction?: unknown
}

function parseDirectionForDelete(input: unknown): FlightDirection | null {
  return input === 'return' || input === 'outbound' || input === 'unknown'
    ? input
    : null
}

export async function DELETE(request: Request, { params }: Params) {
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
    const direction = parseDirectionForDelete(body?.direction)

    if (!direction) {
      return NextResponse.json({ error: 'Direction is required.' }, { status: 400 })
    }

    await deleteTripFlight({
      supabase: ownedTrip.supabase,
      tripId,
      direction,
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
