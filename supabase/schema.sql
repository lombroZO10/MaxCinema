create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin');
create type public.content_type as enum ('movie', 'series');
create type public.content_status as enum ('draft', 'published');
create type public.subscription_provider as enum ('stripe', 'mercado_pago');

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
