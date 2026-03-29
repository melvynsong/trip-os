// Migration/backfill script for flight arrival activities with incorrect day_id
// Usage: node scripts/backfill_flight_arrival_day_ids.js

import { createClient } from '@supabase/supabase-js'
import { getLocalDateFromIsoDatetime } from '../lib/utils/localDateFromIso.ts'

async function backfillFlightArrivalDayIds() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Fetch all flight arrival activities
  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, day_id, activity_time, metadata, type')
    .eq('type', 'flight_arrival')

  if (error) {
    console.error('Failed to fetch activities:', error)
    return
  }

  let updated = 0
  let skipped = 0
  let missing = 0

  for (const activity of activities) {
    const meta = activity.metadata || {}
    const arrivalTime = meta.arrivalTime || activity.activity_time
    const arrTz = meta.arrivalAirportTimezone || meta.arrivalTimezone || meta.arrival_tz || 'UTC'
    const correctLocalDate = getLocalDateFromIsoDatetime(arrivalTime, arrTz)

    // Find the correct day_id for this date
    const { data: dayRow } = await supabase
      .from('days')
      .select('id')
      .eq('date', correctLocalDate)
      .single()

    if (!dayRow) {
      missing++
      continue
    }

    if (activity.day_id !== dayRow.id) {
      // Update only if day_id is wrong
      await supabase
        .from('activities')
        .update({ day_id: dayRow.id })
        .eq('id', activity.id)
      updated++
    } else {
      skipped++
    }
  }

  console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}, Missing day: ${missing}`)
}

backfillFlightArrivalDayIds()
