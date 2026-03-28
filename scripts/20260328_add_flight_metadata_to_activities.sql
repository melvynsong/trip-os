-- Migration: Add metadata and flight_ref columns to activities table if not present
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS flight_ref UUID;