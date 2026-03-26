-- Fix production permissions for stories table
-- Run in Supabase SQL Editor.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.stories to authenticated;

-- Keep RLS enabled and policies active
alter table public.stories enable row level security;
