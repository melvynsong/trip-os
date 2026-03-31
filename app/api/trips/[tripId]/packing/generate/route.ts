import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildPackingPrompt,
  type PackingTripContext,
  type PackingWeatherContext,
  type PackingStyle,
} from '@/lib/ai/packing'
import { normalizePackingList } from '@/lib/ai/packing-normalizer'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { getPackingAccessState } from '@/lib/feature-toggles'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

const VALID_PACKING_STYLES = new Set<PackingStyle>(['light', 'moderate', 'heavy'])

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function asNumberOrNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request, { params }: Params) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    const { tripId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Tier gate: friend and owner only
    let membership
    try {
      membership = await getCurrentUserMembership()
    } catch {
      return NextResponse.json({ error: 'Failed to verify access.' }, { status: 403 })
    }

    const packingAccess = await getPackingAccessState(membership.tier)

    if (!packingAccess.canAccess) {
      const message = !packingAccess.hasRequiredTier
        ? 'Packing is available for Friend and Owner members.'
        : 'Packing (Beta) is currently disabled by admin.'

      return NextResponse.json(
        { error: message },
        { status: 403 }
      )
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, destination, start_date, end_date')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single<{ id: string; destination: string; start_date: string; end_date: string }>()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>

    const packingStyleRaw = asString(body.packingStyle) as PackingStyle
    if (!VALID_PACKING_STYLES.has(packingStyleRaw)) {
      return NextResponse.json(
        { error: 'Invalid packing style. Use light, moderate, or heavy.' },
        { status: 400 }
      )
    }

    // -- Build weather context from optional client-provided weather payload --
    const weatherBody = body.weather as Record<string, unknown> | null | undefined
    const weatherContext: PackingWeatherContext = {
      mode: (['forecast', 'outlook', 'climate'].includes(asString(weatherBody?.mode))
        ? asString(weatherBody?.mode)
        : 'none') as PackingWeatherContext['mode'],
      headline: asString(weatherBody?.headline) || 'Not available',
      note: asString(weatherBody?.note) || null,
      avgMinTempC: asNumberOrNull(weatherBody?.avgMinTempC),
      avgMaxTempC: asNumberOrNull(weatherBody?.avgMaxTempC),
      rainyDaysPercent: asNumberOrNull(weatherBody?.rainyDaysPercent),
    }

    // -- Compute trip duration --
    const startMs = new Date(`${trip.start_date}T00:00:00Z`).getTime()
    const endMs = new Date(`${trip.end_date}T00:00:00Z`).getTime()
    const durationDays = Math.max(
      1,
      Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1
    )

    // --- Fetch itinerary activities for the trip ---
    // Fetch days for the trip
    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('id')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
    if (daysError) {
      return NextResponse.json({ error: 'Failed to load itinerary days.' }, { status: 500 })
    }
    const dayIds = (days || []).map((d: { id: string }) => d.id)

    // Fetch activities for all days
    let activities: any[] = []
    if (dayIds.length > 0) {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('id, day_id, title, activity_time, type, notes, sort_order, place_id, created_at')
        .in('day_id', dayIds)
        .order('day_id', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
      if (activitiesError) {
        return NextResponse.json({ error: 'Failed to load activities.' }, { status: 500 })
      }
      activities = activitiesData || []
    }

    const ctx: PackingTripContext = {
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      durationDays,
      packingStyle: packingStyleRaw,
      weather: weatherContext,
      activities: activities,
    }

    const userPrompt = buildPackingPrompt(ctx)

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              'You are a practical travel assistant. Return only valid JSON. Be concise and realistic. No markdown.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    const aiPayload = (await aiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!aiResponse.ok) {
      const message = aiPayload?.error?.message || 'AI packing generation failed.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const content = aiPayload?.choices?.[0]?.message?.content

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'AI response was empty or malformed.' },
        { status: 500 }
      )
    }

    let data
    try {
      data = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Please try again.' },
        { status: 500 }
      )
    }

    let packingList
    try {
      packingList = normalizePackingList(data, durationDays)
    } catch {
      return NextResponse.json(
        { error: 'AI returned an unreadable packing list. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ packingList })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error generating packing list.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
