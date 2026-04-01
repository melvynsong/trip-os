-- Add latitude and longitude columns to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Optional: backfill latitude/longitude for existing trips using geocoding or place data
-- (You may want to run a script for this part, see below for Node.js example)
