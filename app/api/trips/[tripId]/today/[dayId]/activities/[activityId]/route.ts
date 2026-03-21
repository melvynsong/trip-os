import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActivityStatus } from '@/types/trip'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string; dayId: string; activityId: string }> }

/** Shared ownership check */
async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
  dayId: string,
  activityId: string,
  userId: string
): Promise<boolean> {
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single()

  if (!trip) return false

  const { data: activity } = await supabase
    .from('activities')
    .select('id')
    .eq('id', activityId)
    .eq('day_id', dayId)
    .single()

  return Boolean(activity)
}

/** PATCH — update status or sort_order for a single activity */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { tripId, dayId, activityId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const ok = await verifyOwnership(supabase, tripId, dayId, activityId, user.id)
    if (!ok) {
      return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
    }

    const body = (await request.json()) as {
      status?: ActivityStatus
      sort_order?: number
    }

    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      const validStatuses: ActivityStatus[] = ['planned', 'booked', 'done']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      updates.status = body.status
    }

    if (body.sort_order !== undefined) {
      if (typeof body.sort_order !== 'number') {
        return NextResponse.json({ error: 'Invalid sort_order.' }, { status: 400 })
      }
      updates.sort_order = body.sort_order
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', activityId)
      .select('id, day_id, title, activity_time, type, notes, status, sort_order, place_id')
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? 'Failed to update activity.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ activity: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}

/** DELETE — remove a single activity */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { tripId, dayId, activityId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const ok = await verifyOwnership(supabase, tripId, dayId, activityId, user.id)
    if (!ok) {
      return NextResponse.json({ error: 'Activity not found.' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
