import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildReplanPrompt,
  parseReplanResult,
  REPLAN_JSON_SCHEMA,
  type AiReplanRequest,
  type AiReplanResult,
  type QuickActionType,
} from '@/lib/ai/today'
import { ActivityType } from '@/types/trip'
import { resolvePlaceType } from '@/lib/places'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string; dayId: string }> }

const VALID_ACTIONS: QuickActionType[] = [
  'replan',
  'lighter',
  'lunch_nearby',
  'shorten',
  'replace_attraction',
]

const VALID_TYPES: ActivityType[] = [
  'food',
  'attraction',
  'shopping',
  'transport',
  'hotel',
  'note',
  'other',
]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * POST /api/trips/[tripId]/today/[dayId]/replan
 *
 * Body (mode = 'generate'):
 *   { mode: 'generate', action: QuickActionType, customPrompt?: string }
 *
 * Body (mode = 'apply'):
 *   { mode: 'apply', draft: AiReplanResult }
 */
export async function POST(request: Request, { params }: Params) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    const { tripId, dayId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Verify trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, title, destination')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    // Verify day belongs to trip
    const { data: day, error: dayError } = await supabase
      .from('days')
      .select('id, date, title')
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .single()

    if (dayError || !day) {
      return NextResponse.json({ error: 'Day not found.' }, { status: 404 })
    }

    const body = await request.json()
    const mode = body?.mode as string

    // --------------------------------------------------
    // MODE: generate — build prompt and call OpenAI
    // --------------------------------------------------
    if (mode === 'generate') {
      const action = body?.action as QuickActionType
      if (!action || !VALID_ACTIONS.includes(action)) {
        return NextResponse.json({ error: 'Invalid or missing action.' }, { status: 400 })
      }

      // Load today's activities
      const { data: activities, error: actError } = await supabase
        .from('activities')
        .select('id, title, activity_time, type, notes, status, sort_order')
        .eq('day_id', dayId)
        .order('sort_order', { ascending: true })
        .order('activity_time', { ascending: true })

      if (actError) {
        return NextResponse.json({ error: actError.message }, { status: 500 })
      }

      // Load saved places for this trip
      const { data: places } = await supabase
        .from('places')
        .select('id, name, category, place_type, address')
        .eq('trip_id', tripId)
        .order('name', { ascending: true })

      const req: AiReplanRequest = {
        action,
        customPrompt: typeof body.customPrompt === 'string' ? body.customPrompt : undefined,
        trip: {
          title: trip.title,
          destination: trip.destination,
          notes: null,
        },
        day: {
          date: day.date,
          title: day.title ?? null,
        },
        currentItems: (activities ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          activity_time: a.activity_time,
          type: a.type as ActivityType,
          notes: a.notes,
          status: a.status,
          sort_order: a.sort_order,
        })),
        savedPlaces: (places ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: resolvePlaceType(p),
          address: p.address,
        })),
      }

      const prompt = buildReplanPrompt(req)

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
          temperature: 0.7,
          response_format: {
            type: 'json_schema',
            json_schema: REPLAN_JSON_SCHEMA,
          },
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI travel companion. Return only valid JSON matching the schema.',
            },
            { role: 'user', content: prompt },
          ],
        }),
      })

      const aiPayload = await aiResponse.json()

      if (!aiResponse.ok) {
        const msg = aiPayload?.error?.message ?? 'AI replan failed.'
        return NextResponse.json({ error: msg }, { status: 500 })
      }

      const content = aiPayload?.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 500 })
      }

      const parsed = JSON.parse(content) as unknown
      const draft = parseReplanResult(parsed)

      return NextResponse.json({ draft })
    }

    // --------------------------------------------------
    // MODE: apply — persist draft to Supabase
    // --------------------------------------------------
    if (mode === 'apply') {
      const draft = body?.draft as AiReplanResult | undefined

      if (!draft || !draft.updatedDay || !Array.isArray(draft.updatedDay.activities)) {
        return NextResponse.json({ error: 'Invalid draft payload.' }, { status: 400 })
      }

      // Delete all non-done activities for this day (done ones stay)
      const { error: delError } = await supabase
        .from('activities')
        .delete()
        .eq('day_id', dayId)
        .neq('status', 'done')

      if (delError) {
        return NextResponse.json({ error: delError.message }, { status: 500 })
      }

      // Update day title if AI provided one
      if (draft.updatedDay.title) {
        await supabase
          .from('days')
          .update({ title: draft.updatedDay.title })
          .eq('id', dayId)
      }

      // Insert new activities (AI list, excluding those already done)
      // Get the IDs of done activities so we don't re-insert them
      const { data: doneActivities } = await supabase
        .from('activities')
        .select('id')
        .eq('day_id', dayId)
        .eq('status', 'done')

      const doneIds = new Set((doneActivities ?? []).map((a) => a.id))

      const toInsert = draft.updatedDay.activities
        .filter((a) => !a.id || !doneIds.has(a.id))
        .map((a, index) => {
          const rawType = (a.type ?? 'other').toLowerCase()
          const type: ActivityType = VALID_TYPES.includes(rawType as ActivityType)
            ? (rawType as ActivityType)
            : 'other'
          const time = a.activity_time && TIME_RE.test(a.activity_time) ? a.activity_time : null

          return {
            day_id: dayId,
            title: a.title,
            activity_time: time,
            type,
            notes: a.notes ?? null,
            status: 'planned' as const,
            sort_order: index + 1,
          }
        })

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('activities').insert(toInsert)
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }

      // Return fresh activity list
      const { data: freshActivities, error: fetchError } = await supabase
        .from('activities')
        .select('id, day_id, title, activity_time, type, notes, status, sort_order, place_id')
        .eq('day_id', dayId)
        .order('sort_order', { ascending: true })
        .order('activity_time', { ascending: true })

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      return NextResponse.json({ activities: freshActivities ?? [] })
    }

    return NextResponse.json({ error: 'Invalid mode. Use "generate" or "apply".' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
