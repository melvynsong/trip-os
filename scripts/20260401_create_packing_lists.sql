-- Migration: Create packing_lists table for trip-specific packing lists
-- Description: Stores generated packing lists per trip, with style, content, and timestamps

CREATE TABLE IF NOT EXISTS packing_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    packing_style text NOT NULL,
    generated_content jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by trip
CREATE INDEX IF NOT EXISTS idx_packing_lists_trip_id ON packing_lists(trip_id);
