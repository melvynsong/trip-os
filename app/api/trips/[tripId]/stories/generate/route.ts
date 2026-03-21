import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildDayStoryPrompt,
  buildPlaceStoryPrompt,
  parseStoryDraft,
  STORY_JSON_SCHEMA,
  type DayStoryContext,
  type PlaceStoryContext,
} from '@/lib/ai/story'
import {
  DAY_STORY_FOCUS_OPTIONS,
  PLACE_STORY_TYPE_OPTIONS,
  STORY_LENGTH_OPTIONS,
  STORY_TONE_OPTIONS,
  type DayStoryFocus,
  type PlaceStoryTypeOption,
  type StoryLength,
  type StoryScope,
  type StoryTone,
} from '@/lib/story/types'
import { resolvePlaceType } from '@/lib/places'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

const VALID_TONES = new Set(STORY_TONE_OPTIONS.map((item) => item.value))
const VALID_LENGTHS = new Set(STORY_LENGTH_OPTIONS.map((item) => item.value))
const VALID_DAY_FOCUS = new Set(DAY_STORY_FOCUS_OPTIONS.map((item) => item.value))
const VALID_PLACE_TYPE = new Set(PLACE_STORY_TYPE_OPTIONS.map((item) => item.value))

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseScope(value: unknown): StoryScope | null {
  const v = asString(value)
  return v === 'day' || v === 'place' ? v : null
}

function parseTone(value: unknown): StoryTone | null {
  const v = asString(value) as StoryTone
  return VALID_TONES.has(v) ? v : null
}

function parseLength(value: unknown): StoryLength | null {
  const v = asString(value) as StoryLength
  return VALID_LENGTHS.has(v) ? v : null
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

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, title, destination, notes')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const scope = parseScope(body.scope)
    const tone = parseTone(body.tone)
    const length = parseLength(body.length)

    if (!scope || !tone || !length) {
      return NextResponse.json(
        { error: 'Invalid or missing scope/tone/length.' },
        { status: 400 }
      )
    }

    let prompt = ''
    let inferredStoryType = 'day_summary'
    let relatedDate: string | null = null
    let relatedPlaceId: string | null = null
    let relatedActivityId: string | null = null

    if (scope === 'day') {
      const dayId = asString(body.dayId)
      const focus = asString(body.focus) as DayStoryFocus

      if (!dayId || !VALID_DAY_FOCUS.has(focus)) {
        return NextResponse.json(
          { error: 'Invalid or missing dayId/focus for day story.' },
          { status: 400 }
        )
      }

      const { data: day, error: dayError } = await supabase
        .from('days')
        .select('id, date, title')
        .eq('id', dayId)
        .eq('trip_id', tripId)
        .single()

      if (dayError || !day) {
        return NextResponse.json({ error: 'Day not found.' }, { status: 404 })
      }

      relatedDate = day.date

      const { data: activities } = await supabase
        .from('activities')
        .select('title, activity_time, type, notes, place_id')
        .eq('day_id', dayId)
        .order('sort_order', { ascending: true })
        .order('activity_time', { ascending: true })

      const { data: places } = await supabase
        .from('places')
        .select('id, name, category, place_type, notes, visited')
        .eq('trip_id', tripId)
        .order('name', { ascending: true })

      const hotel = (places || []).find((place) => resolvePlaceType(place) === 'hotel')

      const context: DayStoryContext = {
        tripTitle: trip.title,
        destination: trip.destination,
        tripNotes: trip.notes,
        date: day.date,
        dayTitle: day.title,
        city: trip.destination,
        hotel: hotel?.name ?? null,
        activities: (activities || []).map((activity) => {
          const placeMatch = (places || []).find((item) => item.id === activity.place_id)
          return {
            title: activity.title,
            time: activity.activity_time,
            type: activity.type,
            notes: activity.notes,
            placeName: placeMatch?.name ?? null,
          }
        }),
        visitedPlaces: (places || [])
          .filter((place) => Boolean(place.visited))
          .map((place) => ({
            name: place.name,
            type: resolvePlaceType(place),
            notes: place.notes,
          }))
          .slice(0, 12),
      }

      const built = buildDayStoryPrompt({
        context,
        tone,
        length,
        focus,
      })

      prompt = built.prompt
      inferredStoryType = built.storyType
    }

    if (scope === 'place') {
      const storyOption = asString(body.placeStoryType) as PlaceStoryTypeOption
      if (!VALID_PLACE_TYPE.has(storyOption)) {
        return NextResponse.json(
          { error: 'Invalid or missing placeStoryType.' },
          { status: 400 }
        )
      }

      const placeId = asString(body.placeId) || null
      const activityId = asString(body.activityId) || null
      const dayId = asString(body.dayId) || null

      if (!placeId && !activityId) {
        return NextResponse.json(
          { error: 'Provide placeId or activityId for place story generation.' },
          { status: 400 }
        )
      }

      relatedPlaceId = placeId
      relatedActivityId = activityId

      let context: PlaceStoryContext

      if (placeId) {
        const { data: place, error: placeError } = await supabase
          .from('places')
          .select('id, name, category, place_type, address, notes, visited')
          .eq('id', placeId)
          .eq('trip_id', tripId)
          .single()

        if (placeError || !place) {
          return NextResponse.json({ error: 'Place not found.' }, { status: 404 })
        }

        const { data: relatedActivities } = await supabase
          .from('activities')
          .select('title, activity_time, type, day_id')
          .eq('place_id', placeId)
          .limit(6)

        const relatedDayIds = Array.from(new Set((relatedActivities || []).map((item) => item.day_id)))

        let relatedDateFromActivity: string | null = null
        if (relatedDayIds.length > 0) {
          const { data: relatedDays } = await supabase
            .from('days')
            .select('id, date')
            .in('id', relatedDayIds)
            .limit(1)
          relatedDateFromActivity = relatedDays?.[0]?.date ?? null
        }

        relatedDate = relatedDateFromActivity

        const placeType = resolvePlaceType(place)
        const entityKind: PlaceStoryContext['entityKind'] =
          placeType === 'restaurant' ? 'restaurant' : 'place'

        context = {
          tripTitle: trip.title,
          destination: trip.destination,
          relatedDate,
          entityName: place.name,
          entityKind,
          category: placeType,
          address: place.address,
          notes: place.notes,
          visited: place.visited,
          surroundingContext: (relatedActivities || []).map((item) => ({
            title: item.title,
            time: item.activity_time,
            type: item.type,
          })),
        }
      } else {
        const { data: activity, error: activityError } = await supabase
          .from('activities')
          .select('id, title, type, notes, activity_time, day_id, place_id')
          .eq('id', activityId)
          .single()

        if (activityError || !activity) {
          return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
        }

        const { data: day } = await supabase
          .from('days')
          .select('id, date, trip_id')
          .eq('id', activity.day_id)
          .eq('trip_id', tripId)
          .single()

        if (!day) {
          return NextResponse.json({ error: 'Activity does not belong to this trip.' }, { status: 404 })
        }

        relatedDate = day.date
        relatedPlaceId = activity.place_id ?? null

        const { data: linkedPlace } = activity.place_id
          ? await supabase
              .from('places')
              .select('id, name, address, category, place_type, visited')
              .eq('id', activity.place_id)
              .eq('trip_id', tripId)
              .single()
          : { data: null }

        const placeType = linkedPlace ? resolvePlaceType(linkedPlace) : activity.type
        const entityKind: PlaceStoryContext['entityKind'] =
          activity.type === 'food' ? 'restaurant' : 'activity'

        context = {
          tripTitle: trip.title,
          destination: trip.destination,
          relatedDate,
          entityName: activity.title,
          entityKind,
          category: placeType,
          address: linkedPlace?.address ?? null,
          notes: activity.notes,
          visited: linkedPlace?.visited ?? null,
          surroundingContext: [
            {
              title: activity.title,
              time: activity.activity_time,
              type: activity.type,
            },
          ],
        }
      }

      const built = buildPlaceStoryPrompt({
        context,
        tone,
        length,
        storyOption,
      })
      prompt = built.prompt
      inferredStoryType = built.storyType
    }

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
          json_schema: STORY_JSON_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content:
              'You are a factual travel storytelling assistant. Keep writing grounded in provided data only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const aiPayload = await aiResponse.json()
    if (!aiResponse.ok) {
      const msg = aiPayload?.error?.message ?? 'Story generation failed.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const content = aiPayload?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'AI returned an empty response.' },
        { status: 500 }
      )
    }

    const parsed = parseStoryDraft(JSON.parse(content) as unknown)

    return NextResponse.json({
      draft: {
        ...parsed,
        storyType: parsed.storyType || inferredStoryType,
      },
      meta: {
        scope,
        relatedDate,
        relatedPlaceId,
        relatedActivityId,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
