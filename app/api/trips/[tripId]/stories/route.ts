import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  STORY_LENGTH_OPTIONS,
  STORY_TONE_OPTIONS,
  type SavedStoryType,
  type StoryLength,
  type StoryScope,
  type StoryTone,
} from '@/lib/story/types'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }

const VALID_SCOPES = new Set<StoryScope>(['day', 'place'])
const VALID_TYPES = new Set<SavedStoryType>([
  'day_summary',
  'place_story',
  'restaurant_story',
  'activity_story',
  'caption',
  'food_note',
])
const VALID_TONES = new Set<StoryTone>(STORY_TONE_OPTIONS.map((item) => item.value))
const VALID_LENGTHS = new Set<StoryLength>(STORY_LENGTH_OPTIONS.map((item) => item.value))

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { tripId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: trip } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const url = new URL(request.url)
    const scope = asString(url.searchParams.get('scope'))
    const dayId = asString(url.searchParams.get('dayId'))
    const placeId = asString(url.searchParams.get('placeId'))
    const activityId = asString(url.searchParams.get('activityId'))
    const limitRaw = Number(url.searchParams.get('limit') || 10)
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.floor(limitRaw), 1), 30)
      : 10

    let query = supabase
      .from('stories')
      .select('id, trip_id, story_scope, story_type, related_date, related_place_id, related_activity_id, tone, length, focus, title, content, created_at, updated_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (scope && VALID_SCOPES.has(scope as StoryScope)) {
      query = query.eq('story_scope', scope)
    }

    if (dayId) {
      const { data: day } = await supabase
        .from('days')
        .select('date')
        .eq('id', dayId)
        .eq('trip_id', tripId)
        .single()

      if (day?.date) {
        query = query.eq('related_date', day.date)
      }
    }

    if (placeId) {
      query = query.eq('related_place_id', placeId)
    }

    if (activityId) {
      query = query.eq('related_activity_id', activityId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stories: data ?? [] })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
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

    const { data: trip } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>

    const storyScope = asString(body.story_scope) as StoryScope
    const storyType = asString(body.story_type) as SavedStoryType
    const tone = asString(body.tone) as StoryTone
    const length = asString(body.length) as StoryLength
    const content = asString(body.content)
    const title = asString(body.title) || null
    const focus = asString(body.focus) || null
    const relatedDate = asString(body.related_date) || null
    const relatedPlaceId = asString(body.related_place_id) || null
    const relatedActivityId = asString(body.related_activity_id) || null

    if (!VALID_SCOPES.has(storyScope)) {
      return NextResponse.json({ error: 'Invalid story_scope.' }, { status: 400 })
    }
    if (!VALID_TYPES.has(storyType)) {
      return NextResponse.json({ error: 'Invalid story_type.' }, { status: 400 })
    }
    if (!VALID_TONES.has(tone)) {
      return NextResponse.json({ error: 'Invalid tone.' }, { status: 400 })
    }
    if (!VALID_LENGTHS.has(length)) {
      return NextResponse.json({ error: 'Invalid length.' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Story content is required.' }, { status: 400 })
    }

    if (relatedPlaceId) {
      const { data: place } = await supabase
        .from('places')
        .select('id')
        .eq('id', relatedPlaceId)
        .eq('trip_id', tripId)
        .single()
      if (!place) {
        return NextResponse.json({ error: 'Invalid related_place_id.' }, { status: 400 })
      }
    }

    if (relatedActivityId) {
      const { data: activity } = await supabase
        .from('activities')
        .select('id, day_id')
        .eq('id', relatedActivityId)
        .single()
      if (!activity) {
        return NextResponse.json({ error: 'Invalid related_activity_id.' }, { status: 400 })
      }

      const { data: day } = await supabase
        .from('days')
        .select('trip_id')
        .eq('id', activity.day_id)
        .eq('trip_id', tripId)
        .single()
      if (!day) {
        return NextResponse.json({ error: 'Activity does not belong to this trip.' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('stories')
      .insert({
        trip_id: tripId,
        story_scope: storyScope,
        story_type: storyType,
        related_date: relatedDate,
        related_place_id: relatedPlaceId,
        related_activity_id: relatedActivityId,
        tone,
        length,
        focus,
        title,
        content,
      })
      .select('id, trip_id, story_scope, story_type, related_date, related_place_id, related_activity_id, tone, length, focus, title, content, created_at, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to save story.' }, { status: 500 })
    }

    return NextResponse.json({ story: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
