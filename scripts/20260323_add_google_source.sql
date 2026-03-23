-- Add 'google' as a valid source for the places table
-- The previous constraint only allowed 'openstreetmap' and 'manual'.
-- This migration drops and recreates it to include 'google'.

alter table public.places
  drop constraint if exists places_source_check;

alter table public.places
  add constraint places_source_check
  check (source in ('openstreetmap', 'manual', 'google'));
