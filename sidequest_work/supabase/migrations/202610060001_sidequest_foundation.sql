create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  age_range text,
  home_city text default 'London',
  preferred_transport text default 'best',
  typical_budget integer,
  walking_distance integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  location text,
  area text,
  budget integer,
  time_minutes integer,
  people integer,
  vibes text[] not null default '{}',
  transport text default 'best',
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  provider_place_id text unique,
  name text not null,
  formatted_address text,
  short_address text,
  city text not null default 'London',
  borough text,
  neighbourhood text,
  area text not null,
  latitude double precision,
  longitude double precision,
  category text not null,
  subcategories text[] not null default '{}',
  kind text not null,
  tags text[] not null default '{}',
  description text,
  price_level integer,
  price_min numeric(8,2),
  price_max numeric(8,2),
  currency text not null default 'GBP',
  cost_from integer not null default 0 check (cost_from >= 0),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  age_min integer,
  age_max integer,
  age_restriction text,
  indoor boolean,
  outdoor boolean,
  wheelchair_accessible boolean,
  opening_hours jsonb,
  website_url text,
  phone text,
  google_maps_url text,
  photo_reference text,
  photo_url text,
  photo_attribution text,
  source_url text,
  source_name text,
  verified boolean not null default false,
  last_verified timestamptz,
  image_url text,
  image_alt text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  city text not null,
  area text not null,
  budget integer not null,
  time_minutes integer not null,
  people integer not null,
  vibes text[] not null default '{}',
  total_cost numeric(8,2) not null default 0,
  difficulty numeric(3,1),
  created_at timestamptz not null default now()
);

create table if not exists public.quest_stops (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  stop_number integer not null,
  title text not null,
  description text not null,
  duration_minutes integer not null default 0,
  cost numeric(8,2) not null default 0,
  unique (quest_id, stop_number)
);

create table if not exists public.quest_legs (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  from_stop_id uuid references public.quest_stops(id) on delete cascade,
  to_stop_id uuid references public.quest_stops(id) on delete cascade,
  transport text not null,
  duration_minutes integer,
  instructions text
);

create table if not exists public.saved_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);

create table if not exists public.quest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  completed_at timestamptz,
  rating numeric(2,1) check (rating between 0 and 10),
  spent numeric(8,2),
  duration_minutes integer
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  status text not null default 'active',
  quests_used integer not null default 0,
  period_start date not null default current_date,
  period_end date,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.quests enable row level security;
alter table public.quest_stops enable row level security;
alter table public.quest_legs enable row level security;
alter table public.saved_quests enable row level security;
alter table public.quest_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activities enable row level security;

create policy "activities are publicly readable" on public.activities for select to anon, authenticated using (is_active = true);

create policy "profiles own rows" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "preferences own rows" on public.preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "quests own rows" on public.quests for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saved quests own rows" on public.saved_quests for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "history own rows" on public.quest_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "subscriptions own rows" on public.subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "quest stops through owned quest" on public.quest_stops for all to authenticated using (exists (select 1 from public.quests where quests.id = quest_stops.quest_id and quests.user_id = (select auth.uid()))) with check (exists (select 1 from public.quests where quests.id = quest_stops.quest_id and quests.user_id = (select auth.uid())));
create policy "quest legs through owned quest" on public.quest_legs for all to authenticated using (exists (select 1 from public.quests where quests.id = quest_legs.quest_id and quests.user_id = (select auth.uid()))) with check (exists (select 1 from public.quests where quests.id = quest_legs.quest_id and quests.user_id = (select auth.uid())));

create index if not exists quests_user_created_idx on public.quests (user_id, created_at desc);
create index if not exists activities_area_idx on public.activities (area);
create index if not exists activities_tags_idx on public.activities using gin (tags);

grant select on public.activities to anon, authenticated;
