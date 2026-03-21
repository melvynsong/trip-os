-- Smart Place Search + Save Flow migration
-- Run this in Supabase SQL Editor (safe to rerun).

alter table public.places
  add column if not exists place_type text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists external_place_id text,
  add column if not exists source text,
  add column if not exists visited boolean,
  add column if not exists updated_at timestamptz;

update public.places
set place_type = case
  when place_type is not null then place_type
  when category = 'food' then 'restaurant'
  when category in ('attraction', 'shopping', 'hotel', 'other') then category
  else 'other'
end
where place_type is null;

update public.places
set source = coalesce(source, 'manual'),
    visited = coalesce(visited, false),
    updated_at = coalesce(updated_at, now());

alter table public.places
  alter column place_type set default 'other',
  alter column source set default 'manual',
  alter column visited set default false,
  alter column updated_at set default now();

create index if not exists places_trip_external_place_id_idx
  on public.places (trip_id, external_place_id)
  where external_place_id is not null;

create or replace function public.set_places_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_places_set_updated_at on public.places;
create trigger trg_places_set_updated_at
before update on public.places
for each row
execute function public.set_places_updated_at();

alter table public.places
  drop constraint if exists places_place_type_check;
alter table public.places
  add constraint places_place_type_check
  check (place_type in ('attraction', 'restaurant', 'shopping', 'cafe', 'hotel', 'other'));

alter table public.places
  drop constraint if exists places_source_check;
alter table public.places
  add constraint places_source_check
  check (source in ('google_places', 'manual'));
