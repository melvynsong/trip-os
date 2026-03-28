import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { addSavedFlightToTripTimeline } from '@/lib/flights/trip'
import type { FlightDirection } from '@/src/lib/flights/types'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

type TimelinePayload = { direction?: unknown }

function parseDirection(input: unknown): FlightDirection | null {
  return input === 'return' || input === 'outbound' || input === 'unknown'
    ? input
    : null
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

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json().catch(() => null)) as TimelinePayload | null
    const direction = parseDirection(body?.direction)

    if (!direction) {
      return NextResponse.json({ error: 'Direction is required.' }, { status: 400 })
    }

    const result = await addSavedFlightToTripTimeline({
      supabase,
      tripId,
      direction,
    })

    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/itinerary`)
    revalidatePath(`/trips/${tripId}/today`)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
