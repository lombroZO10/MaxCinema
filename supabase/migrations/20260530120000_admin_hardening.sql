alter type public.user_role add value if not exists 'owner';
alter type public.user_role add value if not exists 'editor';
alter type public.user_role add value if not exists 'moderator';

alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists last_seen_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.seasons
  add column if not exists status public.content_status not null default 'draft',
  add column if not exists sort_order integer not null default 0,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.episodes
  add column if not exists status public.content_status not null default 'draft',
  add column if not exists sort_order integer not null default 0,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.media_assets
  add column if not exists bucket text not null default 'media',
  add column if not exists mime_type text,
  add column if not exists usage text,
  add column if not exists movie_id uuid references public.movies(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  add column if not exists plan_name text,
  add column if not exists provider_price_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_role_status_idx on public.profiles (role, status, created_at desc);
create index if not exists seasons_movie_sort_idx on public.seasons (movie_id, sort_order, season_number);
create index if not exists episodes_season_sort_idx on public.episodes (season_id, sort_order, episode_number);
create index if not exists episodes_status_idx on public.episodes (status, published_at desc);
create index if not exists media_assets_movie_idx on public.media_assets (movie_id, created_at desc);
create index if not exists media_assets_usage_idx on public.media_assets (usage, created_at desc);
create index if not exists subscriptions_status_idx on public.subscriptions (status, current_period_end desc);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists seasons_touch_updated_at on public.seasons;
create trigger seasons_touch_updated_at
  before update on public.seasons
  for each row execute function public.touch_updated_at();

drop trigger if exists episodes_touch_updated_at on public.episodes;
create trigger episodes_touch_updated_at
  before update on public.episodes
  for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

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
      and role::text in ('owner', 'admin', 'editor')
      and status = 'active'
      and blocked_at is null
  );
$$;

create or replace function public.has_admin_read_access()
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
      and role::text in ('owner', 'admin', 'editor', 'moderator')
      and status = 'active'
      and blocked_at is null
  );
$$;

drop policy if exists "Admins read profiles" on public.profiles;
create policy "Admins read profiles" on public.profiles
  for select using (public.has_admin_read_access());

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read subscriptions" on public.subscriptions;
create policy "Admins read subscriptions" on public.subscriptions
  for select using (public.has_admin_read_access());

drop policy if exists "Admins write subscriptions" on public.subscriptions;
create policy "Admins write subscriptions" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read activity" on public.content_activity;
create policy "Admins read activity" on public.content_activity
  for select using (public.has_admin_read_access());

drop policy if exists "Published seasons are visible" on public.seasons;
create policy "Published seasons are visible" on public.seasons
  for select using (
    status = 'published'
    and exists (
      select 1 from public.movies
      where movies.id = seasons.movie_id and movies.status = 'published'
    )
  );

drop policy if exists "Published episodes are visible" on public.episodes;
create policy "Published episodes are visible" on public.episodes
  for select using (
    status = 'published'
    and exists (
      select 1
      from public.seasons
      join public.movies on movies.id = seasons.movie_id
      where seasons.id = episodes.season_id
        and seasons.status = 'published'
        and movies.status = 'published'
    )
  );

insert into public.site_settings (key, value)
values
  ('admin_permissions', '{"roles":["owner","admin","editor","moderator","user"],"writeRoles":["owner","admin","editor"],"readRoles":["owner","admin","editor","moderator"]}'),
  ('home_editor', '{"supportsLivePreview":true,"supportsManualOrdering":true,"supportsHeroSelection":true}'),
  ('media_rules', '{"poster":{"ratio":"2:3","maxSizeMb":8},"backdrop":{"ratio":"16:9","maxSizeMb":12},"trailer":{"formats":["mp4","mov","m3u8"],"maxSizeMb":500}}')
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
