import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildItineraryPrompt,
  parseGeneratedItinerary,
  type AiTripContext,
  type AiTripDayContext,
} from '@/lib/ai/itinerary'

export const runtime = 'nodejs'

const ITINERARY_JSON_SCHEMA = {
  name: 'trip_itinerary_draft',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      days: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            day_number: { type: 'integer' },
            title: { type: 'string' },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  activity_time: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  type: { type: 'string' },
                  notes: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                },
                required: ['title', 'activity_time', 'type', 'notes'],
              },
            },
          },
          required: ['day_number', 'title', 'activities'],
        },
      },
    },
    required: ['days'],
  },
} as const

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server.' },
        { status: 500 }
      )
    }

    const { tripId } = await context.params
    const body = (await request.json()) as { prompt?: string }
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Please enter a prompt for itinerary generation.' },
        { status: 400 }
      )
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
      .select('id, title, destination, start_date, end_date')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single<AiTripContext & { id: string }>()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('id, day_number, date, title')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
      .returns<AiTripDayContext[]>()

    if (daysError) {
      return NextResponse.json(
        { error: `Failed to load trip days: ${daysError.message}` },
        { status: 500 }
      )
    }

    if (!days || days.length === 0) {
      return NextResponse.json(
        { error: 'This trip has no days yet, so there is nowhere to save an itinerary draft.' },
        { status: 400 }
      )
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
          json_schema: ITINERARY_JSON_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content:
              'You are a careful travel planner. Return only valid JSON that matches the schema exactly.',
          },
          {
            role: 'user',
            content: buildItineraryPrompt(trip, days, prompt),
          },
        ],
      }),
    })

    const aiPayload = await aiResponse.json()

    if (!aiResponse.ok) {
      const message =
        aiPayload?.error?.message || 'AI itinerary generation failed.'

      return NextResponse.json({ error: message }, { status: 500 })
    }

    const content = aiPayload?.choices?.[0]?.message?.content

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'AI response was empty or malformed.' },
        { status: 500 }
      )
    }

    const draft = parseGeneratedItinerary(content, days.length)

    return NextResponse.json({ draft })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error generating itinerary.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
