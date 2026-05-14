-- KASAI Supabase Sync Setup
-- Run this whole file in Supabase SQL Editor.
-- It is safe to run more than once.
--
-- It creates missing sync tables, enables RLS, adds own-user policies,
-- and grants the technical API privileges needed by Supabase/PostgREST.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  display_name text not null default 'Champion',
  weight_kg numeric,
  step_goal integer,
  kcal_goal integer,
  water_goal integer,
  protein_min numeric,
  protein_max numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  exercises jsonb not null default '{}'::jsonb,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meals jsonb not null default '[]'::jsonb,
  calories integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  name text not null,
  icon text not null default '*',
  scope text not null default 'daily',
  active_dates jsonb not null default '[]'::jsonb,
  reminder_enabled boolean not null default false,
  reminder_time time,
  streak integer not null default 0,
  completions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, client_id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  notifications_enabled boolean not null default true,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_device_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  device_id text not null,
  device_label text,
  locked_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  device_label text,
  status text not null default 'success',
  area text not null default 'app',
  app_version text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  distance_km numeric(5,2) not null check (distance_km > 0),
  duration_min integer not null check (duration_min > 0),
  run_type text not null default 'Easy Run',
  is_pr boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists display_name text not null default 'Champion';
alter table public.profiles add column if not exists weight_kg numeric;
alter table public.profiles add column if not exists step_goal integer;
alter table public.profiles add column if not exists kcal_goal integer;
alter table public.profiles add column if not exists water_goal integer;
alter table public.profiles add column if not exists protein_min numeric;
alter table public.profiles add column if not exists protein_max numeric;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.training_sessions add column if not exists exercises jsonb not null default '{}'::jsonb;
alter table public.training_sessions add column if not exists duration_minutes integer;
alter table public.training_sessions add column if not exists notes text;
alter table public.training_sessions add column if not exists created_at timestamptz not null default now();
alter table public.training_sessions add column if not exists updated_at timestamptz not null default now();

alter table public.nutrition_logs add column if not exists meals jsonb not null default '[]'::jsonb;
alter table public.nutrition_logs add column if not exists calories integer;
alter table public.nutrition_logs add column if not exists created_at timestamptz not null default now();
alter table public.nutrition_logs add column if not exists updated_at timestamptz not null default now();

alter table public.habits add column if not exists client_id text;
alter table public.habits add column if not exists icon text not null default '*';
alter table public.habits add column if not exists scope text not null default 'daily';
alter table public.habits add column if not exists active_dates jsonb not null default '[]'::jsonb;
alter table public.habits add column if not exists reminder_enabled boolean not null default false;
alter table public.habits add column if not exists reminder_time time;
alter table public.habits add column if not exists streak integer not null default 0;
alter table public.habits add column if not exists completions jsonb not null default '[]'::jsonb;
alter table public.habits add column if not exists created_at timestamptz not null default now();
alter table public.habits add column if not exists updated_at timestamptz not null default now();

alter table public.user_settings add column if not exists theme text not null default 'dark';
alter table public.user_settings add column if not exists notifications_enabled boolean not null default true;
alter table public.user_settings add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.user_settings add column if not exists updated_at timestamptz not null default now();

alter table public.user_app_state add column if not exists state jsonb not null default '{}'::jsonb;
alter table public.user_app_state add column if not exists updated_at timestamptz not null default now();

alter table public.user_device_locks add column if not exists device_id text;
alter table public.user_device_locks add column if not exists device_label text;
alter table public.user_device_locks add column if not exists locked_at timestamptz not null default now();
alter table public.user_device_locks add column if not exists heartbeat_at timestamptz not null default now();
alter table public.user_device_locks add column if not exists updated_at timestamptz not null default now();

alter table public.user_sync_events add column if not exists device_id text;
alter table public.user_sync_events add column if not exists device_label text;
alter table public.user_sync_events add column if not exists status text not null default 'success';
alter table public.user_sync_events add column if not exists area text not null default 'app';
alter table public.user_sync_events add column if not exists app_version text;
alter table public.user_sync_events add column if not exists error_message text;
alter table public.user_sync_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.user_sync_events add column if not exists created_at timestamptz not null default now();

alter table public.runs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.runs add column if not exists date date;
alter table public.runs add column if not exists distance_km numeric(5,2);
alter table public.runs add column if not exists duration_min integer;
alter table public.runs add column if not exists run_type text not null default 'Easy Run';
alter table public.runs add column if not exists is_pr boolean not null default false;
alter table public.runs add column if not exists notes text;
alter table public.runs add column if not exists created_at timestamptz not null default now();
alter table public.runs add column if not exists updated_at timestamptz not null default now();

create unique index if not exists training_sessions_user_date_unique
  on public.training_sessions(user_id, date);
create unique index if not exists nutrition_logs_user_date_unique
  on public.nutrition_logs(user_id, date);
create unique index if not exists habits_user_client_id_unique
  on public.habits(user_id, client_id);
create index if not exists runs_user_date_idx
  on public.runs(user_id, date desc);
create index if not exists user_sync_events_user_created_idx
  on public.user_sync_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.training_sessions enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.habits enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_app_state enable row level security;
alter table public.user_device_locks enable row level security;
alter table public.user_sync_events enable row level security;
alter table public.runs enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_app_state'
  ) then
    alter publication supabase_realtime add table public.user_app_state;
  end if;
end $$;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.training_sessions to anon, authenticated;
grant select, insert, update, delete on public.nutrition_logs to anon, authenticated;
grant select, insert, update, delete on public.habits to anon, authenticated;
grant select, insert, update, delete on public.user_settings to anon, authenticated;
grant select, insert, update, delete on public.user_app_state to anon, authenticated;
grant select, insert, update, delete on public.user_device_locks to anon, authenticated;
grant select, insert, delete on public.user_sync_events to anon, authenticated;
grant select, insert, update, delete on public.runs to anon, authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "training_sessions_select_own" on public.training_sessions;
drop policy if exists "training_sessions_insert_own" on public.training_sessions;
drop policy if exists "training_sessions_update_own" on public.training_sessions;
drop policy if exists "training_sessions_delete_own" on public.training_sessions;
create policy "training_sessions_select_own" on public.training_sessions for select using (auth.uid() = user_id);
create policy "training_sessions_insert_own" on public.training_sessions for insert with check (auth.uid() = user_id);
create policy "training_sessions_update_own" on public.training_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "training_sessions_delete_own" on public.training_sessions for delete using (auth.uid() = user_id);

drop policy if exists "nutrition_logs_select_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_insert_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_update_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_delete_own" on public.nutrition_logs;
create policy "nutrition_logs_select_own" on public.nutrition_logs for select using (auth.uid() = user_id);
create policy "nutrition_logs_insert_own" on public.nutrition_logs for insert with check (auth.uid() = user_id);
create policy "nutrition_logs_update_own" on public.nutrition_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition_logs_delete_own" on public.nutrition_logs for delete using (auth.uid() = user_id);

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;
drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_delete_own" on public.user_settings for delete using (auth.uid() = user_id);

drop policy if exists "user_app_state_select_own" on public.user_app_state;
drop policy if exists "user_app_state_insert_own" on public.user_app_state;
drop policy if exists "user_app_state_update_own" on public.user_app_state;
drop policy if exists "user_app_state_delete_own" on public.user_app_state;
create policy "user_app_state_select_own" on public.user_app_state for select using (auth.uid() = user_id);
create policy "user_app_state_insert_own" on public.user_app_state for insert with check (auth.uid() = user_id);
create policy "user_app_state_update_own" on public.user_app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_app_state_delete_own" on public.user_app_state for delete using (auth.uid() = user_id);

drop policy if exists "user_device_locks_select_own" on public.user_device_locks;
drop policy if exists "user_device_locks_insert_own" on public.user_device_locks;
drop policy if exists "user_device_locks_update_own" on public.user_device_locks;
drop policy if exists "user_device_locks_delete_own" on public.user_device_locks;
create policy "user_device_locks_select_own" on public.user_device_locks for select using (auth.uid() = user_id);
create policy "user_device_locks_insert_own" on public.user_device_locks for insert with check (auth.uid() = user_id);
create policy "user_device_locks_update_own" on public.user_device_locks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_device_locks_delete_own" on public.user_device_locks for delete using (auth.uid() = user_id);

drop policy if exists "user_sync_events_select_own" on public.user_sync_events;
drop policy if exists "user_sync_events_insert_own" on public.user_sync_events;
drop policy if exists "user_sync_events_delete_own" on public.user_sync_events;
create policy "user_sync_events_select_own" on public.user_sync_events for select using (auth.uid() = user_id);
create policy "user_sync_events_insert_own" on public.user_sync_events for insert with check (auth.uid() = user_id);
create policy "user_sync_events_delete_own" on public.user_sync_events for delete using (auth.uid() = user_id);

drop policy if exists "runs_select_own" on public.runs;
drop policy if exists "runs_insert_own" on public.runs;
drop policy if exists "runs_update_own" on public.runs;
drop policy if exists "runs_delete_own" on public.runs;
create policy "runs_select_own" on public.runs for select using (auth.uid() = user_id);
create policy "runs_insert_own" on public.runs for insert with check (auth.uid() = user_id);
create policy "runs_update_own" on public.runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "runs_delete_own" on public.runs for delete using (auth.uid() = user_id);

create or replace function public.acquire_device_lock(
  p_device_id text,
  p_device_label text default null,
  p_takeover boolean default false,
  p_stale_after_seconds integer default 90
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.user_device_locks%rowtype;
  v_stale boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select * into v_existing
  from public.user_device_locks
  where user_id = v_user_id
  for update;

  if not found then
    insert into public.user_device_locks(user_id, device_id, device_label, locked_at, heartbeat_at)
    values (v_user_id, p_device_id, p_device_label, now(), now());
    return jsonb_build_object('ok', true, 'reason', 'created');
  end if;

  v_stale := v_existing.heartbeat_at < now() - make_interval(secs => p_stale_after_seconds);

  if v_existing.device_id = p_device_id or v_stale or p_takeover then
    update public.user_device_locks
    set device_id = p_device_id,
        device_label = p_device_label,
        locked_at = case when v_existing.device_id = p_device_id then locked_at else now() end,
        heartbeat_at = now()
    where user_id = v_user_id;
    return jsonb_build_object('ok', true, 'reason', case when v_stale then 'stale_taken' when p_takeover then 'taken_over' else 'same_device' end);
  end if;

  return jsonb_build_object(
    'ok', false,
    'reason', 'locked_elsewhere',
    'device_label', v_existing.device_label,
    'heartbeat_at', v_existing.heartbeat_at
  );
end;
$$;

create or replace function public.heartbeat_device_lock(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return false;
  end if;

  update public.user_device_locks
  set heartbeat_at = now()
  where user_id = v_user_id
    and device_id = p_device_id;

  return found;
end;
$$;

create or replace function public.release_device_lock(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return false;
  end if;

  delete from public.user_device_locks
  where user_id = v_user_id
    and device_id = p_device_id;

  return found;
end;
$$;

grant execute on function public.acquire_device_lock(text, text, boolean, integer) to anon, authenticated;
grant execute on function public.heartbeat_device_lock(text) to anon, authenticated;
grant execute on function public.release_device_lock(text) to anon, authenticated;
