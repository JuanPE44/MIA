-- Profiles (one per auth user) with the subscription plan, plus per-period usage counters.

create type public.plan_tier as enum ('free', 'extended', 'pro');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan public.plan_tier not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users may edit their own row, but never the plan: only the server (service role) changes it.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- Create the profile automatically when an auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Time-boxed usage counters (e.g. infographics per day, podcasts per week).
-- RLS is enabled with no policies: only the service role (server) can touch it.
create table public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  period_start date not null,
  count int not null default 0,
  primary key (user_id, kind, period_start)
);

alter table public.usage_counters enable row level security;

-- Atomically consumes one unit of quota. Returns false (and changes nothing)
-- when the counter would exceed p_limit.
create function public.increment_usage(p_user uuid, p_kind text, p_period date, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if p_limit <= 0 then
    return false;
  end if;

  insert into public.usage_counters as u (user_id, kind, period_start, count)
  values (p_user, p_kind, p_period, 1)
  on conflict (user_id, kind, period_start)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.increment_usage(uuid, text, date, int) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid, text, date, int) to service_role;
