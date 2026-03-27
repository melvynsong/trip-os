create table if not exists public.admin_config (
  tier text primary key,
  trip_limit integer null,
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint admin_config_tier_check check (tier in ('free', 'friend', 'owner')),
  constraint admin_config_trip_limit_check check (trip_limit is null or trip_limit > 0)
);

insert into public.admin_config (tier, trip_limit, feature_flags)
values
  ('free', 1, '{"googlePlaces": true, "tripDeletion": true, "aiFeatures": true}'::jsonb),
  ('friend', 3, '{"googlePlaces": true, "tripDeletion": true, "aiFeatures": true}'::jsonb),
  ('owner', null, '{"googlePlaces": true, "tripDeletion": true, "aiFeatures": true}'::jsonb)
on conflict (tier) do update
set trip_limit = excluded.trip_limit,
    feature_flags = excluded.feature_flags,
    updated_at = timezone('utc', now());
