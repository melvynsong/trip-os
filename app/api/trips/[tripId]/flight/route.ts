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


    // Map flight to activities to get local dates
    let [depActivity, arrActivity] = mapFlightToActivities(savedFlight, dayIdMap);
    // If either activity is missing, try to auto-create the missing day(s) and retry
    if (!depActivity || !arrActivity) {
      // Find which dates are missing
      const missingDates = [];
      if (!depActivity) {
        const depDate = savedFlight.departureTime?.slice(0, 10);
        if (depDate && !dayIdMap[depDate]) missingDates.push(depDate);
      }
      if (!arrActivity) {
        const arrDate = savedFlight.arrivalTime?.slice(0, 10);
        if (arrDate && !dayIdMap[arrDate]) missingDates.push(arrDate);
      }
      // Fetch trip start_date
      const { data: tripData } = await ownedTrip.supabase
        .from('trips')
        .select('start_date')
        .eq('id', tripId)
        .single();
      if (!tripData?.start_date) {
        return NextResponse.json({ error: 'Trip start date not found.' }, { status: 400 });
      }
      const tripStart = new Date(tripData.start_date);
      for (const date of missingDates) {
        const target = new Date(date);
        const dayNumber = Math.floor((target.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (dayNumber < 1) {
          console.warn('[FlightDayDebug] Blocked creation: flight date before trip start', { date, dayNumber, tripStart: tripData.start_date });
          return NextResponse.json({ error: `Flight date ${date} is before trip start date (${tripData.start_date}).` }, { status: 400 });
        }
        // Create the missing day
        const { data: newDay, error: dayInsertError } = await ownedTrip.supabase
          .from('days')
          .insert({ trip_id: tripId, date, day_number: dayNumber })
          .select('id')
          .single();
        if (!dayInsertError && newDay) {
          dayIdMap[date] = newDay.id;
        } else {
          // If duplicate, try to fetch the day again
          if (dayInsertError?.code === '23505' || dayInsertError?.message?.includes('duplicate')) {
            const { data: existingDay } = await ownedTrip.supabase
              .from('days')
              .select('id')
              .eq('trip_id', tripId)
              .eq('date', date)
              .single();
            if (existingDay) {
              dayIdMap[date] = existingDay.id;
            } else {
              console.warn('[FlightDayDebug] Duplicate day insert but could not fetch existing day:', { date });
              return NextResponse.json({ error: `Failed to create or fetch day for date ${date}.` }, { status: 500 });
            }
          } else {
            console.warn('[FlightDayDebug] Failed to insert day:', { date, dayNumber, error: dayInsertError });
            return NextResponse.json({ error: `Failed to create day for date ${date}.` }, { status: 500 });
          }
        }
      }
      // Re-map activities with updated dayIdMap
      [depActivity, arrActivity] = mapFlightToActivities(savedFlight, dayIdMap);
      if (!depActivity || !arrActivity) {
        console.warn('[FlightActivityDebug] Blocked: Could not create both departure and arrival activities after auto-creating days.', {
          depActivity, arrActivity, dayIdMap, savedFlight
        });
        return NextResponse.json({
          error: 'Cannot create both departure and arrival activities even after auto-creating days.'
        }, { status: 400 });
      }
    }
    // Insert both activities
    console.log('[FlightActivityDebug] Inserting departure activity:', depActivity);
    const { error: depErr } = await ownedTrip.supabase.from('activities').insert({
      ...depActivity,
      status: 'planned',
    })
    console.log('[FlightActivityDebug] Inserting arrival activity:', arrActivity);
    const { error: arrErr } = await ownedTrip.supabase.from('activities').insert({
      ...arrActivity,
      status: 'planned',
    })
    if (depErr || arrErr) {
      console.warn('[FlightActivityDebug] Failed to insert activities:', { depErr, arrErr });
      return NextResponse.json({ error: 'Failed to create flight activities.' }, { status: 500 })
    }

    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/flight`)
    revalidatePath(`/trips/${tripId}/itinerary`)
    return NextResponse.json({ flight: savedFlight, activities: [depActivity, arrActivity] })
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
