import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeGeneratedItinerary } from '@/lib/ai/itinerary'

type RouteContext = {
  params: Promise<{ tripId: string }>
}

export const runtime = 'nodejs'

export async function POST(request: Request, context: RouteContext) {
  try {
    const { tripId } = await context.params
    const body = (await request.json()) as { draft?: unknown }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('id, day_number, date, title')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })

    if (daysError || !days || days.length === 0) {
      return NextResponse.json(
        { error: 'Trip days could not be loaded for saving.' },
        { status: 400 }
      )
    }

    const draft = normalizeGeneratedItinerary(body.draft, days.length)
    const dayIds = days.map((day) => day.id)

    const { data: existingActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('day_id, sort_order')
      .in('day_id', dayIds)

    if (activitiesError) {
      return NextResponse.json(
        { error: `Failed to inspect existing activities: ${activitiesError.message}` },
        { status: 500 }
      )
    }

    const nextSortOrderByDay = new Map<string, number>()

    for (const day of days) {
      const maxSortOrder = (existingActivities || [])
        .filter((activity) => activity.day_id === day.id)
        .reduce((max, activity) => Math.max(max, activity.sort_order || 0), 0)

      nextSortOrderByDay.set(day.id, maxSortOrder + 1)
    }

    const rows = draft.days.flatMap((generatedDay) => {
      const day = days.find((item) => item.day_number === generatedDay.day_number)

      if (!day) {
        return []
      }

      return generatedDay.activities.map((activity) => {
        const sortOrder = nextSortOrderByDay.get(day.id) || 1
        nextSortOrderByDay.set(day.id, sortOrder + 1)

        return {
          day_id: day.id,
          place_id: null,
          title: activity.title,
          activity_time: activity.activity_time,
          type: activity.type,
          notes: activity.notes,
          status: 'planned' as const,
          sort_order: sortOrder,
        }
      })
    })

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'There were no generated activities to save.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase.from('activities').insert(rows)

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save generated itinerary: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insertedCount: rows.length,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error saving itinerary.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
