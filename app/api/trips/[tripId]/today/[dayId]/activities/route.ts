import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActivityType } from '@/types/trip'

export const runtime = 'nodejs'

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

type Params = { params: Promise<{ tripId: string; dayId: string }> }

/** POST /api/trips/[tripId]/today/[dayId]/activities — add a new activity */
export async function POST(request: Request, { params }: Params) {
  try {
    const { tripId, dayId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Verify day belongs to this trip and trip belongs to user
    const { data: day, error: dayError } = await supabase
      .from('days')
      .select('id, trip_id')
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .single()

    if (dayError || !day) {
      return NextResponse.json({ error: 'Day not found.' }, { status: 404 })
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const body = (await request.json()) as {
      title?: string
      activity_time?: string | null
      type?: string
      notes?: string | null
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const rawType = typeof body.type === 'string' ? body.type.toLowerCase() : 'other'
    const type: ActivityType = VALID_TYPES.includes(rawType as ActivityType)
      ? (rawType as ActivityType)
      : 'other'

    const rawTime = typeof body.activity_time === 'string' ? body.activity_time.trim() : null
    const activity_time = rawTime && TIME_RE.test(rawTime) ? rawTime : null

    const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null

    // Get the current max sort_order so we append to the end
    const { data: maxRow } = await supabase
      .from('activities')
      .select('sort_order')
      .eq('day_id', dayId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sort_order = maxRow ? maxRow.sort_order + 1 : 1

    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({ day_id: dayId, title, activity_time, type, notes, sort_order, status: 'planned' })
      .select('id, day_id, title, activity_time, type, notes, status, sort_order, place_id')
      .single()

    if (insertError || !activity) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to create activity.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
