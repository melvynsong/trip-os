import { createClient } from '../lib/supabase/client'

/**
 * Migration script to merge paired flight activities (departure/arrival) into a single unified flight activity per journey.
 * - Finds pairs of 'transport' activities with matching flight number and close timestamps.
 * - Creates a new 'flight' activity with both departure and arrival info.
 * - Deletes the old paired activities.
 */

async function migrateFlights() {
  const supabase = await createClient()
  // 1. Find all trips
  const { data: trips, error: tripError } = await supabase.from('trips').select('id')
  if (tripError) throw tripError
  for (const trip of trips) {
    // 2. Find all 'transport' activities for this trip
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', trip.id)
      .eq('type', 'transport')
    if (actError) throw actError
    // 3. Group by flight number (from notes/title)
    const flightsByNumber: Record<string, any[]> = {}
    for (const act of activities) {
      const match = /([A-Z]{2,3}\s?\d{1,4}[A-Z]?)/.exec(act.title + ' ' + (act.notes || ''))
      if (!match) continue
      const flightNum = match[1].replace(/\s+/, ' ').trim()
      if (!flightsByNumber[flightNum]) flightsByNumber[flightNum] = []
      flightsByNumber[flightNum].push(act)
    }
    // 4. For each group, try to pair departure/arrival
    for (const [flightNum, acts] of Object.entries(flightsByNumber)) {
      if (acts.length < 2) continue
      // Find pairs: one with 'depart' in title/notes, one with 'arrive'
      const dep = acts.find(a => /depart/i.test(a.title + ' ' + (a.notes || '')))
      const arr = acts.find(a => /arriv/i.test(a.title + ' ' + (a.notes || '')))
      if (!dep || !arr) continue
      // 5. Create unified flight activity
      const flightActivity = {
        trip_id: trip.id,
        day_id: dep.day_id,
        type: 'flight',
        airline: '', // Could parse from notes if needed
        flightNumber: flightNum,
        carrierCode: '',
        departure: {
          airportCode: '',
          airportName: '',
          city: '',
          terminal: '',
          datetime: dep.activity_time || '',
        },
        arrival: {
          airportCode: '',
          airportName: '',
          city: '',
          terminal: '',
          datetime: arr.activity_time || '',
        },
        duration: '',
        aircraft: '',
        notes: (dep.notes || '') + ' ' + (arr.notes || ''),
        rawMetadata: {},
        created_at: dep.created_at,
      }
      // 6. Insert new flight activity
      const { error: insertError } = await supabase.from('activities').insert(flightActivity)
      if (insertError) {
        console.error('Failed to insert unified flight activity', insertError)
        continue
      }
      // 7. Delete old activities
      await supabase.from('activities').delete().in('id', [dep.id, arr.id])
      console.log(`Migrated flight ${flightNum} for trip ${trip.id}`)
    }
  }
  console.log('Migration complete.')
}

migrateFlights().catch(console.error)
