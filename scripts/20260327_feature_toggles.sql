create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.app_settings (setting_key, setting_value)
values
  ('packing_beta_enabled', 'true'::jsonb)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    updated_at = timezone('utc', now());

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select_authenticated on public.app_settings;
create policy app_settings_select_authenticated
on public.app_settings
for select
using (auth.uid() is not null);

drop policy if exists app_settings_insert_owner on public.app_settings;
create policy app_settings_insert_owner
on public.app_settings
for insert
with check (
  exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.tier = 'owner'
      and m.is_active = true
  )
);

drop policy if exists app_settings_update_owner on public.app_settings;
create policy app_settings_update_owner
on public.app_settings
for update
using (
  exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.tier = 'owner'
      and m.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.tier = 'owner'
      and m.is_active = true
  )
);
