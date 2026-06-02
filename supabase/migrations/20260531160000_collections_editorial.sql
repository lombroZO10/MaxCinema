-- Editorial Collections + Home Section sources

do $$ begin
  create type public.collection_status as enum ('draft', 'published', 'archived', 'scheduled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.collection_visibility as enum ('public', 'hidden', 'members_only', 'kids');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.collection_type as enum ('manual', 'dynamic', 'seasonal', 'top_10', 'originals', 'trending', 'recommended', 'editorial');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.home_section_source_type as enum ('manual', 'collection', 'dynamic');
exception when duplicate_object then null;
end $$;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  banner_url text,
  cover_url text,
  accent_color text not null default '#13c8ff',
  icon text not null default 'film',
  type public.collection_type not null default 'editorial',
  status public.collection_status not null default 'draft',
  visibility public.collection_visibility not null default 'public',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  position integer not null default 0,
  note text,
  pinned boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (collection_id, movie_id)
);

alter table public.home_sections
  add column if not exists source_type public.home_section_source_type not null default 'manual',
  add column if not exists source_id uuid,
  add column if not exists layout_variant text,
  add column if not exists display_limit integer,
  add column if not exists show_collection_banner boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

create index if not exists collections_sort_order_idx on public.collections (status, visibility, sort_order);
create index if not exists collection_items_collection_pos_idx on public.collection_items (collection_id, position);
create index if not exists home_sections_source_idx on public.home_sections (source_type, source_id);

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

drop trigger if exists collections_touch_updated_at on public.collections;
create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

do $$ begin
  create policy "Collections visible" on public.collections
    for select using (visibility = 'public' and status = 'published');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can read all collections" on public.collections
    for select using (public.is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can write collections" on public.collections
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Collection items visible" on public.collection_items
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can write collection items" on public.collection_items
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

