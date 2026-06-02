alter table public.movies
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists rating numeric(3,1) not null default 8.8,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_original boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.genres
  add column if not exists color text not null default '#13c8ff',
  add column if not exists icon text not null default 'film',
  add column if not exists active boolean not null default true,
  add column if not exists sort_order integer not null default 0;

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type text not null default 'rail',
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (section_id, movie_id)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text not null,
  type text not null,
  width integer,
  height integer,
  size bigint,
  alt_text text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists movies_sort_order_idx on public.movies (sort_order, created_at desc);
create index if not exists movies_original_idx on public.movies (is_original) where is_original = true;
create index if not exists home_sections_position_idx on public.home_sections (active, position);
create index if not exists home_section_items_position_idx on public.home_section_items (section_id, position);
create index if not exists media_assets_type_idx on public.media_assets (type, created_at desc);
create index if not exists content_activity_entity_idx on public.content_activity (entity_type, entity_id, created_at desc);

alter table public.home_sections enable row level security;
alter table public.home_section_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_activity enable row level security;

drop trigger if exists home_sections_touch_updated_at on public.home_sections;
create trigger home_sections_touch_updated_at
  before update on public.home_sections
  for each row execute function public.touch_updated_at();

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

create policy "Active home sections are visible" on public.home_sections
  for select using (active = true or public.is_admin());

create policy "Active home section items are visible" on public.home_section_items
  for select using (
    exists (
      select 1 from public.home_sections
      where home_sections.id = home_section_items.section_id
        and (home_sections.active = true or public.is_admin())
    )
  );

create policy "Media assets are visible" on public.media_assets
  for select using (true);

create policy "Public site settings are visible" on public.site_settings
  for select using (true);

create policy "Admins read activity" on public.content_activity
  for select using (public.is_admin());

create policy "Admins write home sections" on public.home_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins write home section items" on public.home_section_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins write media assets" on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins write site settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins write activity" on public.content_activity
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.home_sections (title, slug, type, position, active)
values
  ('Em destaque', 'em-destaque', 'hero', 0, true),
  ('Populares no MaxCinema', 'populares', 'rail', 1, true),
  ('Originais MaxCinema', 'originais-maxcinema', 'rail', 2, true),
  ('Lancamentos', 'lancamentos', 'rail', 3, true)
on conflict (slug) do nothing;

insert into public.site_settings (key, value)
values
  ('branding', '{"siteName":"MaxCinema","studioName":"MaxCinema Admin Studio","visualSystem":"Command Center 2026"}'),
  ('seo', '{"title":"MaxCinema","description":"Streaming premium cinematografico."}')
on conflict (key) do nothing;
