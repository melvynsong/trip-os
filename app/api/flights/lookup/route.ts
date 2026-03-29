import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { findTripFlightByLookup } from '@/lib/flights/trip'
import { AeroDataBoxApiError } from '@/src/lib/flights/aerodatabox'
import { lookupFlightByNumberAndDate, normalizeFlightNumber, validateFlightLookupInput } from '@/src/lib/flights/service'

export const runtime = 'nodejs'

type LookupPayload = {
  tripId?: unknown
  flightNumber?: unknown
  flightDate?: unknown
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

export async function POST(request: Request) {
  try {
    const access = await getCurrentUserFlightAccessState().catch(() => null)

    if (!access) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as LookupPayload | null
    const input = validateFlightLookupInput(body)
    const normalized = normalizeFlightNumber(input.flightNumber)

    const tripId = typeof body?.tripId === 'string' ? body.tripId.trim() : ''

    if (tripId) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
      }

      const ownedTrip = await verifyTripOwnership(tripId, user.id)
      if (!ownedTrip) {
        return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
      }

      const cachedFlight = await findTripFlightByLookup({
        supabase: ownedTrip.supabase,
        tripId,
        normalizedFlightNumber: normalized.normalized,
        flightDate: input.flightDate,
      })

      if (cachedFlight) {
        return NextResponse.json({
          cached: true,
          from: 'trip_cache',
          flight: {
            normalizedFlightNumber: cachedFlight.normalizedFlightNumber,
            flightDate: cachedFlight.flightDate,
            airlineName: cachedFlight.airlineName,
            airlineCode: cachedFlight.airlineCode,
            flightNumber: cachedFlight.flightNumber,
            departureAirportCode: cachedFlight.departureAirportCode,
            departureAirportName: cachedFlight.departureAirportName,
            departureCity: cachedFlight.departureCity,
            departureTime: cachedFlight.departureTime,
            departureTerminal: cachedFlight.departureTerminal,
            arrivalAirportCode: cachedFlight.arrivalAirportCode,
            arrivalAirportName: cachedFlight.arrivalAirportName,
            arrivalCity: cachedFlight.arrivalCity,
            arrivalTime: cachedFlight.arrivalTime,
            arrivalTerminal: cachedFlight.arrivalTerminal,
            status: cachedFlight.status,
            aircraftModel: cachedFlight.aircraftModel,
            dataProvider: 'cache' as const,
            rawResponseJson: cachedFlight.rawResponseJson,
          },
        })
      }
    }

    // Add logging for debugging date matching issues
    const result = await lookupFlightByNumberAndDate(input)

    // Log input and result details for debugging
    // eslint-disable-next-line no-console
    console.log('[FlightLookupAPI] Debug:', {
      inputFlightDate: input.flightDate,
      resultDepartureTime: result?.departureTime,
      resultArrivalTime: result?.arrivalTime,
      resultDepartureAirportTimezone: result?.departureAirportTimezone,
      resultArrivalAirportTimezone: result?.arrivalAirportTimezone,
      rawResponseJson: result?.rawResponseJson,
    })

    if (!result) {
      return NextResponse.json(
        {
          error: 'We couldn’t find this flight. Check the flight number and date, then try again. Example format: SQ895 or SQ 895.',
        },
        { status: 404 }
      )
    }

    // Include debug info in the API response for troubleshooting
    return NextResponse.json({
      cached: false,
      from: 'provider',
      flight: result,
      debug: {
        inputFlightDate: input.flightDate,
        resultDepartureTime: result?.departureTime,
        resultArrivalTime: result?.arrivalTime,
        resultDepartureAirportTimezone: result?.departureAirportTimezone,
        resultArrivalAirportTimezone: result?.arrivalAirportTimezone,
        rawResponseJson: result?.rawResponseJson,
      },
    })
  } catch (error) {
    const status = error instanceof AeroDataBoxApiError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unexpected error looking up flight.'

    return NextResponse.json({ error: message }, { status })
  }
}
