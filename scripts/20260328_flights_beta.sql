-- Flight (Beta) - Add Flight by Flight Number (AeroDataBox)
-- Run in Supabase SQL Editor. Safe to rerun.

create table if not exists public.trip_flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  direction text not null,
  normalized_flight_number text not null,
  flight_date date not null,
  airline_code text not null,
  airline_name text,
  flight_number text not null,
  departure_airport_code text not null,
  departure_airport_name text,
  departure_city text,
  departure_time text not null,
  departure_terminal text,
  arrival_airport_code text not null,
  arrival_airport_name text,
  arrival_city text,
  arrival_time text not null,
  arrival_terminal text,
  status text,
  aircraft_model text,
  data_provider text not null default 'aerodatabox',
  raw_response_json jsonb,
  selected_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Backward-compatible column adjustments if table already exists from earlier migration.
alter table public.trip_flights add column if not exists normalized_flight_number text;
alter table public.trip_flights add column if not exists flight_date date;
alter table public.trip_flights add column if not exists status text;
alter table public.trip_flights add column if not exists aircraft_model text;
alter table public.trip_flights add column if not exists data_provider text;
alter table public.trip_flights add column if not exists raw_response_json jsonb;

update public.trip_flights
set normalized_flight_number = coalesce(normalized_flight_number, concat_ws(' ', airline_code, flight_number))
where normalized_flight_number is null;

update public.trip_flights
set flight_date = coalesce(flight_date, nullif(left(departure_time, 10), '')::date)
where flight_date is null;

update public.trip_flights
set data_provider = coalesce(data_provider, 'aerodatabox')
where data_provider is null;

alter table public.trip_flights alter column normalized_flight_number set not null;
alter table public.trip_flights alter column flight_date set not null;
alter table public.trip_flights alter column data_provider set not null;

alter table public.trip_flights
  drop constraint if exists trip_flights_direction_check;
alter table public.trip_flights
  add constraint trip_flights_direction_check
  check (direction in ('outbound', 'return', 'unknown'));

create unique index if not exists trip_flights_trip_direction_uidx
  on public.trip_flights (trip_id, direction);

create index if not exists trip_flights_trip_lookup_idx
  on public.trip_flights (trip_id, normalized_flight_number, flight_date);

create index if not exists trip_flights_trip_selected_idx
  on public.trip_flights (trip_id, selected_at desc);

create or replace function public.set_trip_flights_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_trip_flights_set_updated_at on public.trip_flights;
create trigger trg_trip_flights_set_updated_at
before update on public.trip_flights
for each row
execute function public.set_trip_flights_updated_at();

alter table public.trip_flights enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.trip_flights to authenticated;

drop policy if exists trip_flights_select_own on public.trip_flights;
create policy trip_flights_select_own
  on public.trip_flights
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_flights.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists trip_flights_insert_own on public.trip_flights;
create policy trip_flights_insert_own
  on public.trip_flights
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_flights.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists trip_flights_update_own on public.trip_flights;
create policy trip_flights_update_own
  on public.trip_flights
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_flights.trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_flights.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists trip_flights_delete_own on public.trip_flights;
create policy trip_flights_delete_own
  on public.trip_flights
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_flights.trip_id and t.user_id = auth.uid()
    )
  );

insert into public.app_settings (setting_key, setting_value)
values
  ('flight_beta_enabled', 'true'::jsonb)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    updated_at = timezone('utc', now());
