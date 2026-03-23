import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserTripCreationEntitlements } from '@/lib/membership/server'

export const runtime = 'nodejs'

type CreateTripPayload = {
  title?: string
  destination?: string
  start_date?: string
  end_date?: string
}

function getTripLimitMessage(tier: 'free' | 'friend') {
  if (tier === 'free') {
    return 'You have reached your Free tier limit of 1 trip this calendar year.'
  }

  return 'You have reached your Friend tier limit of 3 trips this calendar year.'
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
    const destination = String(body.destination || '').trim()
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

    if (start > end) {
      return NextResponse.json({ error: 'Start date must be before end date.' }, { status: 400 })
    }

    const entitlements = await getCurrentUserTripCreationEntitlements()

    if (!entitlements.isGmailAllowed) {
      return NextResponse.json(
        { error: 'Only gmail.com accounts are currently allowed to create trips.' },
        { status: 403 }
      )
    }

    if (entitlements.remainingTripsThisYear !== null && entitlements.remainingTripsThisYear <= 0) {
      return NextResponse.json(
        {
          error:
            entitlements.tier === 'owner'
              ? 'Trip creation is currently unavailable.'
              : getTripLimitMessage(entitlements.tier),
        },
        { status: 403 }
      )
    }

    const { error: insertError } = await supabase.from('trips').insert({
      user_id: user.id,
      title,
      destination,
      start_date: startDate,
      end_date: endDate,
    })

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create trip: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error creating trip.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
