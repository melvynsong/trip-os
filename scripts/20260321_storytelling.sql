-- Storytelling feature (day + place/activity stories)
-- Run in Supabase SQL Editor. Safe to rerun.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  story_scope text not null,
  story_type text not null,
  related_date date,
  related_place_id uuid references public.places(id) on delete set null,
  related_activity_id uuid references public.activities(id) on delete set null,
  tone text not null,
  length text not null,
  focus text,
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stories
  drop constraint if exists stories_story_scope_check;
alter table public.stories
  add constraint stories_story_scope_check
  check (story_scope in ('day', 'place'));

alter table public.stories
  drop constraint if exists stories_story_type_check;
alter table public.stories
  add constraint stories_story_type_check
  check (story_type in ('day_summary', 'place_story', 'restaurant_story', 'activity_story', 'caption', 'food_note'));

alter table public.stories
  drop constraint if exists stories_tone_check;
alter table public.stories
  add constraint stories_tone_check
  check (tone in ('warm_personal', 'fun_casual', 'reflective', 'travel_journal', 'family_memory', 'food_focused'));

alter table public.stories
  drop constraint if exists stories_length_check;
alter table public.stories
  add constraint stories_length_check
  check (length in ('short', 'medium', 'long'));

create index if not exists stories_trip_created_idx
  on public.stories (trip_id, created_at desc);

create index if not exists stories_scope_date_idx
  on public.stories (trip_id, story_scope, related_date);

create index if not exists stories_place_idx
  on public.stories (trip_id, related_place_id)
  where related_place_id is not null;

create index if not exists stories_activity_idx
  on public.stories (trip_id, related_activity_id)
  where related_activity_id is not null;

create or replace function public.set_stories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_stories_set_updated_at on public.stories;
create trigger trg_stories_set_updated_at
before update on public.stories
for each row
execute function public.set_stories_updated_at();

alter table public.stories enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.stories to authenticated;

drop policy if exists stories_select_own on public.stories;
create policy stories_select_own
  on public.stories
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = stories.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists stories_insert_own on public.stories;
create policy stories_insert_own
  on public.stories
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = stories.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists stories_update_own on public.stories;
create policy stories_update_own
  on public.stories
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = stories.trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = stories.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists stories_delete_own on public.stories;
create policy stories_delete_own
  on public.stories
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = stories.trip_id and t.user_id = auth.uid()
    )
  );
