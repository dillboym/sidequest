create table if not exists public.catalogue_places (
  id text primary key,
  name text not null,
  source text not null,
  source_id text not null,
  address jsonb not null,
  coordinates jsonb not null,
  primary_area text not null,
  eligible_areas text[] not null default '{}',
  activity text not null,
  activity_group text not null,
  genres text[] not null default '{}',
  price jsonb not null,
  typical_duration_minutes integer not null,
  indoor boolean,
  outdoor boolean,
  minimum_age integer,
  adult_or_restricted boolean not null default false,
  quality text not null,
  usable boolean not null default true,
  source_dataset text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalogue_area_places (
  area_slug text not null,
  place_id text not null references public.catalogue_places(id) on delete cascade,
  rank integer not null,
  primary key (area_slug, place_id)
);

alter table public.catalogue_places enable row level security;
alter table public.catalogue_area_places enable row level security;

create policy "catalogue places are publicly readable" on public.catalogue_places for select to anon, authenticated using (usable = true);
create policy "catalogue area places are publicly readable" on public.catalogue_area_places for select to anon, authenticated using (true);
