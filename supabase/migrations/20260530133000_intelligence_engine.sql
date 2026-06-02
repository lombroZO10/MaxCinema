create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  genre_id uuid references public.genres(id) on delete cascade,
  score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, action, genre_id)
);

create table if not exists public.user_similarity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  similar_user_id uuid not null references auth.users(id) on delete cascade,
  similarity_score numeric(5,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, similar_user_id),
  check (user_id <> similar_user_id)
);

create table if not exists public.recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  movie_id uuid references public.movies(id) on delete cascade,
  section_slug text not null,
  recommendation_score numeric(7,2) not null default 0,
  reason text,
  event text not null default 'shown',
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

create table if not exists public.content_trending (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  period text not null,
  category text not null default 'all',
  rank integer not null default 0,
  trend_score numeric(7,2) not null default 0,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movie_id, period, category)
);

create index if not exists user_preferences_user_idx on public.user_preferences (user_id, score desc);
create index if not exists user_similarity_user_idx on public.user_similarity (user_id, similarity_score desc);
create index if not exists recommendation_logs_user_idx on public.recommendation_logs (user_id, created_at desc);
create index if not exists recommendation_logs_movie_idx on public.recommendation_logs (movie_id, event, created_at desc);
create index if not exists content_scores_recommendation_idx on public.content_scores (recommendation_score desc);
create index if not exists content_trending_period_idx on public.content_trending (period, category, rank);

alter table public.user_preferences enable row level security;
alter table public.user_similarity enable row level security;
alter table public.recommendation_logs enable row level security;
alter table public.content_scores enable row level security;
alter table public.content_trending enable row level security;

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute function public.touch_updated_at();

drop trigger if exists user_similarity_touch_updated_at on public.user_similarity;
create trigger user_similarity_touch_updated_at
  before update on public.user_similarity
  for each row execute function public.touch_updated_at();

drop trigger if exists content_scores_touch_updated_at on public.content_scores;
create trigger content_scores_touch_updated_at
  before update on public.content_scores
  for each row execute function public.touch_updated_at();

drop trigger if exists content_trending_touch_updated_at on public.content_trending;
create trigger content_trending_touch_updated_at
  before update on public.content_trending
  for each row execute function public.touch_updated_at();

create policy "Users read own preferences" on public.user_preferences
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users write own preferences" on public.user_preferences
  for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "Users read own similarity" on public.user_similarity
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins write similarity" on public.user_similarity
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own recommendation logs" on public.recommendation_logs
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users write own recommendation logs" on public.recommendation_logs
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "Admins update recommendation logs" on public.recommendation_logs
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Content scores are visible" on public.content_scores
  for select using (true);

create policy "Admins write content scores" on public.content_scores
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Trending content is visible" on public.content_trending
  for select using (true);

create policy "Admins write trending content" on public.content_trending
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value)
values
  ('intelligence_engine', '{"enabled":true,"version":"2026.1","signals":["watch_progress","favorites","genres","rating","trending","similar_users"],"scoreWeights":{"genreMatch":40,"favorite":20,"completion":10,"similarUsers":30,"trend":10}}')
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
