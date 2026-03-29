import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserEntitlements } from '@/lib/entitlements'
import { getCurrentUserMembership } from '@/lib/membership/server'
import type { MembershipTier } from '@/lib/membership/types'
import { buildPrimaryDestination, uniqueByPlaceId, type TripLocation } from '@/lib/trips/locations'

export const runtime = 'nodejs'

type CreateTripPayload = {
  title?: string
  destination?: string
  destinations?: TripLocation[]
  start_date?: string
  end_date?: string
}

function getTripLimitMessage(tier: MembershipTier, limit: number | 'unlimited') {
  if (limit === 'unlimited') return 'Trip creation is currently unavailable.'
  return `You have reached your ${tier === 'free' ? 'Free' : 'Friend'} tier limit of ${limit} trip${limit === 1 ? '' : 's'} this calendar year.`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a trip.' }, { status: 401 })
    }

    const body = (await request.json()) as CreateTripPayload
    const title = String(body.title || '').trim()
    const destinationsInput = Array.isArray(body.destinations) ? body.destinations : []
    const destinations = uniqueByPlaceId(
      destinationsInput
        .map((location): TripLocation | null => {
          if (!location || typeof location !== 'object') return null
          const name = String(location.name || '').trim()
          const country = location.country ? String(location.country).trim() : null
          const type = location.type === 'country' ? 'country' : location.type === 'city' ? 'city' : null
          const placeId = String(location.placeId || '').trim()
          const lat = typeof location.lat === 'number' && Number.isFinite(location.lat) ? location.lat : null
          const lng = typeof location.lng === 'number' && Number.isFinite(location.lng) ? location.lng : null

          if (!name || !type || !placeId) return null

          return {
            name,
            country,
            type,
            placeId,
            lat,
            lng,
          }
        })
        .filter((location): location is TripLocation => location !== null)
    )

    const fallbackDestination = String(body.destination || '').trim()
    const destination = buildPrimaryDestination(destinations) || fallbackDestination
    const startDate = String(body.start_date || '').trim()
    const endDate = String(body.end_date || '').trim()

    if (!title) {
      return NextResponse.json({ error: 'Trip title is required.' }, { status: 400 })
    }
    if (!destination) {
      return NextResponse.json({ error: 'Destination is required.' }, { status: 400 })
    }
    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required.' }, { status: 400 })
    }
    if (!endDate) {
      return NextResponse.json({ error: 'End date is required.' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Please provide valid dates.' }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 })
    }

    const membership = await getCurrentUserMembership()

    if (!membership.isGmailAllowed) {
      return NextResponse.json(
        { error: 'Only gmail.com accounts are currently allowed to create trips.' },
        { status: 403 }
      )
    }

    const entitlements = await getCurrentUserEntitlements()

    if (!entitlements.canCreateTrip) {
      return NextResponse.json(
        { error: getTripLimitMessage(entitlements.tier, entitlements.tripLimit) },
        { status: 403 }
      )
    }

    const { data: createdTrip, error: insertError } = await supabase
      .from('trips')
      .insert({
      user_id: user.id,
      title,
      destination,
      start_date: startDate,
      end_date: endDate,
    })
      .select('id')
      .single<{ id: string }>()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create trip: ${insertError.message}` },
        { status: 500 }
      )
    }

    if (createdTrip && destinations.length > 0) {
      const placeRows = destinations.map((location) => ({
        trip_id: createdTrip.id,
        name: location.name,
        category: 'other',
        address: null,
        city: location.type === 'city' ? location.name : null,
        country: location.country,
        latitude: location.lat,
        longitude: location.lng,
        external_place_id: location.placeId,
        source: 'manual',
      }))

      const { error: placeInsertError } = await supabase.from('places').insert(placeRows)

      if (placeInsertError) {
        console.warn('Failed to seed destination places for trip', {
          tripId: createdTrip.id,
          error: placeInsertError.message,
        })
      }
    }

    // Insert all days from start_date to end_date (inclusive)
    if (createdTrip) {
      const days = [];
      let current = new Date(startDate);
      const end = new Date(endDate);
      let dayNumber = 1;
      while (current <= end) {
        days.push({
          trip_id: createdTrip.id,
          date: current.toISOString().slice(0, 10),
          day_number: dayNumber,
        });
        current.setDate(current.getDate() + 1);
        dayNumber++;
      }
      const { error: daysInsertError } = await supabase.from('days').insert(days);
      if (daysInsertError) {
        console.warn('Failed to seed days for trip', {
          tripId: createdTrip.id,
          error: daysInsertError.message,
        });
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error creating trip.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
