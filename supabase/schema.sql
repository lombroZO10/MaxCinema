create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin');
create type public.content_type as enum ('movie', 'series');
create type public.content_status as enum ('draft', 'published');
create type public.subscription_provider as enum ('stripe', 'mercado_pago');
create type public.collection_status as enum ('draft', 'published', 'archived', 'scheduled');
create type public.collection_visibility as enum ('public', 'hidden', 'members_only', 'kids');
create type public.collection_type as enum ('manual', 'dynamic', 'seasonal', 'top_10', 'originals', 'trending', 'recommended', 'editorial');
create type public.home_section_source_type as enum ('manual', 'collection', 'recommendation', 'dynamic');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  type public.content_type not null default 'movie',
  poster_url text,
  backdrop_url text,
  trailer_url text,
  mux_playback_id text,
  release_year integer,
  duration_minutes integer,
  maturity_rating text,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.movie_genres (
  movie_id uuid not null references public.movies(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (movie_id, genre_id)
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  progress_seconds integer not null default 0,
  duration_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.subscription_provider not null,
  provider_customer_id text,
  provider_subscription_id text,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  season_number integer not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (movie_id, season_number)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  title text not null,
  description text,
  episode_number integer not null,
  duration_minutes integer,
  poster_url text,
  mux_playback_id text,
  created_at timestamptz not null default now(),
  unique (season_id, episode_number)
);

-- Editorial Collections (not genres/categories)
create table public.collections (
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
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
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

-- Home editorial programming tables (referenced by the app)
create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type text not null default 'rail',
  position integer not null default 0,
  active boolean not null default true,
  source_type public.home_section_source_type not null default 'manual',
  source_id uuid,
  source_key text,
  subtitle text,
  layout_variant text,
  display_limit integer,
  show_collection_banner boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
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

create index movies_status_featured_idx on public.movies (status, featured);
create index movies_slug_idx on public.movies (slug);
create index favorites_user_idx on public.favorites (user_id);
create index watch_progress_user_idx on public.watch_progress (user_id, updated_at desc);
create index episodes_season_idx on public.episodes (season_id, episode_number);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger movies_touch_updated_at
  before update on public.movies
  for each row execute function public.touch_updated_at();

create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.genres enable row level security;
alter table public.movie_genres enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_progress enable row level security;
alter table public.subscriptions enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_section_items enable row level security;

create policy "Published movies are visible" on public.movies
  for select using (status = 'published');

create policy "Admins can read all movies" on public.movies
  for select using (public.is_admin());

create policy "Admins can write movies" on public.movies
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Genres are visible" on public.genres
  for select using (true);

create policy "Admins can write genres" on public.genres
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Movie genres are visible" on public.movie_genres
  for select using (true);

create policy "Admins can write movie genres" on public.movie_genres
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published seasons are visible" on public.seasons
  for select using (
    exists (
      select 1 from public.movies
      where movies.id = seasons.movie_id and movies.status = 'published'
    )
  );

create policy "Admins can write seasons" on public.seasons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published episodes are visible" on public.episodes
  for select using (
    exists (
      select 1
      from public.seasons
      join public.movies on movies.id = seasons.movie_id
      where seasons.id = episodes.season_id and movies.status = 'published'
    )
  );

create policy "Admins can write episodes" on public.episodes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Admins read profiles" on public.profiles
  for select using (public.is_admin());

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own progress" on public.watch_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Collections visible" on public.collections
  for select using (visibility = 'public' and status = 'published');

create policy "Admins can read all collections" on public.collections
  for select using (public.is_admin());

create policy "Admins can write collections" on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Collection items visible" on public.collection_items
  for select using (true);

create policy "Admins can write collection items" on public.collection_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Home sections visible" on public.home_sections
  for select using (true);

create policy "Admins can write home sections" on public.home_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Home section items visible" on public.home_section_items
  for select using (true);

create policy "Admins can write home section items" on public.home_section_items
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  524288000,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/vnd.apple.mpegurl']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public media is readable" on storage.objects
  for select using (bucket_id = 'media');

create policy "Admins can upload media" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

create policy "Admins can update media" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

create policy "Admins can delete media" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- Admin Studio extensions

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

alter table public.home_sections
  add column if not exists source_type public.home_section_source_type not null default 'manual',
  add column if not exists source_id uuid,
  add column if not exists source_key text,
  add column if not exists subtitle text,
  add column if not exists layout_variant text,
  add column if not exists display_limit integer,
  add column if not exists show_collection_banner boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text not null,
  bucket text not null default 'media',
  type text not null,
  mime_type text,
  usage text,
  movie_id uuid references public.movies(id) on delete set null,
  width integer,
  height integer,
  size bigint,
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint media_assets_size_non_negative check (size is null or size >= 0),
  constraint media_assets_bucket_not_blank check (length(trim(bucket)) > 0),
  constraint media_assets_usage_not_blank check (usage is null or length(trim(usage)) > 0)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  "group" text not null default 'advanced',
  type text not null default 'json',
  label text not null default '',
  description text not null default '',
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists "group" text not null default 'advanced',
  add column if not exists type text not null default 'json',
  add column if not exists label text not null default '',
  add column if not exists description text not null default '',
  add column if not exists is_public boolean not null default false,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.content_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.viewer_profiles(id) on delete cascade,
  action text not null,
  genre_id uuid references public.genres(id) on delete cascade,
  score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.viewer_profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  section_slug text not null,
  section_title text,
  recommendation_score numeric(7,2) not null default 0,
  reason text,
  event text not null default 'shown',
  event_type text not null default 'view',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.content_scores (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null unique references public.movies(id) on delete cascade,
  popularity_score numeric(7,2) not null default 0,
  quality_score numeric(7,2) not null default 0,
  completion_score numeric(7,2) not null default 0,
  favorite_score numeric(7,2) not null default 0,
  recommendation_score numeric(7,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.viewer_profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  source text not null default 'browse',
  watch_seconds integer not null default 0,
  completed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists movies_sort_order_idx on public.movies (sort_order, created_at desc);
create index if not exists movies_original_idx on public.movies (is_original) where is_original = true;
create index if not exists home_sections_position_idx on public.home_sections (active, position);
create index if not exists home_sections_source_idx on public.home_sections (source_type, source_id);
create index if not exists home_sections_recommendation_source_idx on public.home_sections (source_type, source_key, position) where source_type = 'recommendation';
create index if not exists home_section_items_position_idx on public.home_section_items (section_id, position);
create index if not exists media_assets_type_idx on public.media_assets (type, created_at desc);
create index if not exists media_assets_bucket_path_idx on public.media_assets (bucket, path);
create index if not exists media_assets_mime_created_idx on public.media_assets (mime_type, created_at desc) where mime_type is not null;
create index if not exists content_activity_entity_idx on public.content_activity (entity_type, entity_id, created_at desc);
create index if not exists user_preferences_user_idx on public.user_preferences (user_id, score desc);
create index if not exists recommendation_logs_user_idx on public.recommendation_logs (user_id, created_at desc);
create index if not exists recommendation_logs_movie_idx on public.recommendation_logs (movie_id, event, created_at desc);
create index if not exists recommendation_logs_section_event_idx on public.recommendation_logs (section_slug, event_type, created_at desc);
create index if not exists content_scores_recommendation_idx on public.content_scores (recommendation_score desc);
create index if not exists content_views_movie_created_idx on public.content_views (movie_id, created_at desc);
create index if not exists site_settings_group_idx on public.site_settings ("group", key);
create index if not exists site_settings_public_idx on public.site_settings (is_public) where is_public = true;

alter table public.home_sections enable row level security;
alter table public.home_section_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_activity enable row level security;
alter table public.user_preferences enable row level security;
alter table public.recommendation_logs enable row level security;
alter table public.content_scores enable row level security;
alter table public.content_views enable row level security;

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

create policy "Users read own preferences" on public.user_preferences
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users write own preferences" on public.user_preferences
  for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "Users read own recommendation logs" on public.recommendation_logs
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users write own recommendation logs" on public.recommendation_logs
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "Content scores are visible" on public.content_scores
  for select using (true);

create policy "Admins write content scores" on public.content_scores
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own content views" on public.content_views
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users write own content views" on public.content_views
  for insert with check (auth.uid() = user_id or public.is_admin());

insert into public.home_sections (title, slug, type, position, active)
values
  ('Em destaque', 'em-destaque', 'hero', 0, true),
  ('Populares no MaxCinema', 'populares', 'rail', 1, true),
  ('Originais MaxCinema', 'originais-maxcinema', 'rail', 2, true),
  ('Lancamentos', 'lancamentos', 'rail', 3, true)
on conflict (slug) do nothing;

insert into public.site_settings (key, value, "group", type, label, description, is_public)
values
  ('general.siteName', '"MaxCinema"', 'general', 'string', 'Nome do site', 'Nome publico usado no Browse, SEO e Admin.', true),
  ('general.slogan', '"Cinema OS para uma nova era de streaming."', 'general', 'string', 'Slogan', 'Frase curta para hero, previews e compartilhamentos.', true),
  ('general.platformStatus', '"online"', 'general', 'select', 'Status da plataforma', 'Online, manutencao, privado ou somente admins.', true),
  ('identity.logoUrl', '""', 'identity', 'url', 'Logo principal', 'URL da logo usada publicamente.', true),
  ('identity.backdropFallbackUrl', '"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86"', 'identity', 'url', 'Backdrop fallback', 'Imagem 16:9 usada quando falta backdrop.', true),
  ('theme.primaryColor', '"#13c8ff"', 'theme', 'color', 'Cor primaria', 'Acao principal, foco e highlights.', true),
  ('theme.secondaryColor', '"#ff9f43"', 'theme', 'color', 'Cor secundaria', 'Acento editorial e estados especiais.', true),
  ('theme.backgroundColor', '"#030609"', 'theme', 'color', 'Fundo', 'Base visual da plataforma.', true),
  ('theme.textColor', '"#f6fbff"', 'theme', 'color', 'Texto principal', 'Cor de leitura principal.', true),
  ('seo.title', '"MaxCinema | Cinema OS 2026"', 'seo', 'string', 'SEO title', 'Titulo padrao de paginas publicas.', true),
  ('seo.description', '"Plataforma premium de streaming com interface Cinema OS 2026."', 'seo', 'string', 'SEO description', 'Descricao padrao para buscadores.', true),
  ('seo.twitterCard', '"summary_large_image"', 'seo', 'select', 'Twitter card', 'Formato do card para X/Twitter.', true),
  ('player.provider', '"hls"', 'player', 'select', 'Provider padrao', 'local, hls, mux ou external.', false),
  ('player.showTrailerButton', 'true', 'player', 'boolean', 'Mostrar botao trailer', 'Exibe CTA de trailer quando disponivel.', true),
  ('player.showFavoriteButton', 'true', 'player', 'boolean', 'Mostrar botao favoritos', 'Exibe favoritos nos cards e hero.', true),
  ('browse.cardsPerSection', '12', 'browse', 'number', 'Cards por secao', 'Limite padrao para rails publicos.', true),
  ('browse.showRecommendations', 'true', 'browse', 'boolean', 'Mostrar recomendacoes', 'Exibe secoes personalizadas.', true),
  ('browse.showContinueWatching', 'true', 'browse', 'boolean', 'Mostrar continuar assistindo', 'Exibe progresso do usuario.', true),
  ('browse.showRating', 'true', 'browse', 'boolean', 'Mostrar nota', 'Exibe rating nos cards.', true),
  ('browse.showDuration', 'true', 'browse', 'boolean', 'Mostrar duracao', 'Exibe duracao nos cards.', true),
  ('browse.showGenres', 'true', 'browse', 'boolean', 'Mostrar generos', 'Exibe generos nos cards.', true),
  ('browse.heroRotating', 'true', 'browse', 'boolean', 'Hero rotativo', 'Alterna destaques automaticamente.', true),
  ('admin.compactMode', 'false', 'admin', 'boolean', 'Modo compacto', 'Reduz espacamento do Studio.', false),
  ('admin.showMetrics', 'true', 'admin', 'boolean', 'Mostrar metricas', 'Exibe cards numericos do Studio.', false),
  ('admin.showPreviews', 'true', 'admin', 'boolean', 'Mostrar previews', 'Exibe previews editoriais no admin.', false),
  ('media.maxPosterMb', '10', 'media', 'number', 'Poster maximo MB', 'Limite operacional para upload de poster.', false),
  ('media.maxBackdropMb', '12', 'media', 'number', 'Backdrop maximo MB', 'Limite operacional para backdrop e banners.', false),
  ('media.allowedImageFormats', '"jpg,jpeg,png,webp,avif"', 'media', 'string', 'Formatos de imagem', 'Formatos aceitos separados por virgula.', false),
  ('media.storageBucket', '"media"', 'media', 'string', 'Bucket de storage', 'Bucket padrao de uploads.', false),
  ('maintenance.enabled', 'false', 'maintenance', 'boolean', 'Modo manutencao', 'Exibe bloqueio para usuarios comuns.', true)
on conflict (key) do update
set
  "group" = excluded."group",
  type = excluded.type,
  label = excluded.label,
  description = excluded.description,
  is_public = excluded.is_public;


-- User library extensions

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

create index if not exists watch_progress_user_updated_idx
  on public.watch_progress (user_id, updated_at desc);

drop trigger if exists watch_progress_touch_updated_at on public.watch_progress;
create trigger watch_progress_touch_updated_at
  before update on public.watch_progress
  for each row execute function public.touch_updated_at();

