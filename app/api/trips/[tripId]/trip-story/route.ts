import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildTripStoryPrompt, parseTripStoryDraft, TRIP_STORY_JSON_SCHEMA } from '@/lib/ai/trip-story'
import { STORY_LENGTH_OPTIONS, STORY_TONE_OPTIONS, type StoryLength, type StoryTone } from '@/lib/story/types'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

const VALID_TONES = new Set(STORY_TONE_OPTIONS.map((item) => item.value))
const VALID_LENGTHS = new Set(STORY_LENGTH_OPTIONS.map((item) => item.value))

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request, { params }: Params) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 })
    }

    const { tripId } = await params
    const body = (await request.json()) as Record<string, unknown>
    const tone = asString(body.tone) as StoryTone
    const length = asString(body.length) as StoryLength

    if (!VALID_TONES.has(tone) || !VALID_LENGTHS.has(length)) {
      return NextResponse.json({ error: 'Invalid tone or length.' }, { status: 400 })
    }
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date, notes')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('id, day_number, date, title')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })

    if (daysError) {
      return NextResponse.json({ error: daysError.message }, { status: 500 })
    }

    const dayIds = (days || []).map((day) => day.id)

    const { data: activities, error: activitiesError } = dayIds.length
      ? await supabase
          .from('activities')
          .select('id, day_id, title, activity_time, type, notes, place_id, sort_order')
          .in('day_id', dayIds)
          .order('sort_order', { ascending: true })
          .order('activity_time', { ascending: true })
      : { data: [], error: null }

    if (activitiesError) {
      return NextResponse.json({ error: activitiesError.message }, { status: 500 })
    }

    const placeIds = Array.from(
      new Set((activities || []).map((item) => item.place_id).filter(Boolean))
    ) as string[]

    const { data: places } = placeIds.length
      ? await supabase
          .from('places')
          .select('id, name')
          .in('id', placeIds)
      : { data: [] }

    const placeMap = new Map((places || []).map((place) => [place.id, place.name]))

    const prompt = buildTripStoryPrompt({
      tone,
      length,
      context: {
        tripTitle: trip.title,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        notes: trip.notes,
        days: (days || []).map((day) => ({
          dayNumber: day.day_number,
          date: day.date,
          title: day.title,
          activities: (activities || [])
            .filter((activity) => activity.day_id === day.id)
            .map((activity) => ({
              time: activity.activity_time,
              title: activity.title,
              location: activity.place_id ? placeMap.get(activity.place_id) || null : null,
              notes: activity.notes,
              type: activity.type,
            })),
        })),
      },
    })

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        temperature: 0.8,
        response_format: {
          type: 'json_schema',
          json_schema: TRIP_STORY_JSON_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content: 'You are a premium travel editor writing grounded narrative trip stories from structured data only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const aiPayload = await aiResponse.json()
    if (!aiResponse.ok) {
      const message = aiPayload?.error?.message ?? 'Trip story generation failed.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const content = aiPayload?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 500 })
    }

    const story = parseTripStoryDraft(JSON.parse(content) as unknown)

    return NextResponse.json({ story })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
