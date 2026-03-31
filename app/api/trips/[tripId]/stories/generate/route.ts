import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildStoryPrompt, type StoryTone } from '@/lib/ai/story'
import { normalizeStoryAIResult } from '@/lib/ai/story-normalizer'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    const { tripId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    let body: { scope?: unknown; dayId?: unknown; tone?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const scope = 'day'
    const tone = typeof body.tone === 'string' && [
      'warm_personal',
      'fun_casual',
      'reflective',
      'journal',
      'family_memory',
    ].includes(body.tone) ? body.tone as StoryTone : 'warm_personal'
    let relatedDate: string | null = null
    let relatedPlaceId: string | null = null
    let relatedActivityId: string | null = null

    // Only support 'day' stories for now
    const dayId = typeof body.dayId === 'string' ? body.dayId : null
    if (!dayId) {
      return NextResponse.json(
        { error: 'Missing dayId for day story.' },
        { status: 400 }
      )
    }

    const { data: day, error: dayError } = await supabase
      .from('days')
      .select('id, date, title, day_number')
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .single()
    if (dayError || !day) {
      return NextResponse.json({ error: 'Day not found.' }, { status: 404 })
    }
    relatedDate = day.date

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('title, activity_time, type, notes')
      .eq('day_id', dayId)
      .order('activity_time', { ascending: true })
    if (activitiesError) {
      return NextResponse.json({ error: 'Failed to load activities.' }, { status: 500 })
    }
    if (!activities || activities.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one activity to this day before generating a story.' },
        { status: 400 }
      )
    }

    const mappedActivities = activities.map((a) => ({
      title: a.title,
      time: a.activity_time,
      type: a.type,
      notes: a.notes,
    }))

    const prompt = buildStoryPrompt(
      { title: trip.title, destination: trip.destination },
      { day_number: day.day_number, date: day.date, title: day.title },
      mappedActivities,
      tone
    )

    const STORY_JSON_SCHEMA = {
      name: 'story_draft',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          tone: {
            type: 'string',
            enum: [
              'warm_personal',
              'fun_casual',
              'reflective',
              'journal',
              'family_memory',
            ],
          },
        },
        required: ['title', 'content', 'tone'],
      },
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: STORY_JSON_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content: 'You are a careful travel storyteller. Return only valid JSON that matches the schema exactly.',
          },
          {
            role: 'user',
            content: prompt,
          },
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

    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'The story response could not be read. Please try again.' },
        { status: 502 }
      )
    }

    let draft
    try {
      draft = normalizeStoryAIResult(parsedContent, {
        tripDestination: trip.destination,
        dayNumber: day.day_number,
        activities: mappedActivities,
      })
    } catch {
      return NextResponse.json(
        { error: 'Generated story was incomplete. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      draft: {
        ...draft,
        storyType: 'day_summary',
      },
      meta: {
        scope: 'day',
        relatedDate: day.date,
        relatedPlaceId: null,
        relatedActivityId: null,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}