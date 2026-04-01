// scripts/backfill_trip_lat_lng.cjs
// Usage: node scripts/backfill_trip_lat_lng.cjs
// Requires SUPABASE_URL, SUPABASE_SERVICE_KEY, and GOOGLE_MAPS_API_KEY in your environment

console.log('=== Script is starting (pre-require) ===');
console.log('Backfill script started...');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function geocode(destination) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  }
  return null;
}

async function main() {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, destination')
    .is('latitude', null)
    .is('longitude', null);

  if (error) {
    console.error('Error fetching trips:', error);
    process.exit(1);
  }

  for (const trip of trips) {
    if (!trip.destination) continue;
    const coords = await geocode(trip.destination);
    if (coords) {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', trip.id);
      if (updateError) {
        console.error(`Failed to update trip ${trip.id}:`, updateError);
      } else {
        console.log(`Updated trip ${trip.id} with lat/lng.`);
      }
    } else {
      console.warn(`Could not geocode destination for trip ${trip.id}: ${trip.destination}`);
    }
  }
  console.log('Backfill complete.');
}

main();
