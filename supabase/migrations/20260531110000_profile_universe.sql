create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'premium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id)
);

create table if not exists public.viewer_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  profile_type text not null default 'adult' check (profile_type in ('adult', 'kids')),
  theme_color text not null default '#13c8ff',
  language text not null default 'pt-BR',
  maturity_limit text not null default '18',
  autoplay_enabled boolean not null default true,
  trailer_autoplay_enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.favorites add column if not exists profile_id uuid references public.viewer_profiles(id) on delete cascade;
alter table public.watch_progress add column if not exists profile_id uuid references public.viewer_profiles(id) on delete cascade;
alter table public.recommendation_logs add column if not exists profile_id uuid references public.viewer_profiles(id) on delete cascade;
alter table public.user_preferences add column if not exists profile_id uuid references public.viewer_profiles(id) on delete cascade;

alter table public.favorites drop constraint if exists favorites_user_id_movie_id_key;
alter table public.watch_progress drop constraint if exists watch_progress_user_id_movie_id_key;

create index if not exists idx_accounts_owner_user_id on public.accounts(owner_user_id);
create index if not exists idx_viewer_profiles_user_id on public.viewer_profiles(user_id);
create index if not exists idx_viewer_profiles_account_id on public.viewer_profiles(account_id);
create index if not exists idx_viewer_profiles_last_used_at on public.viewer_profiles(last_used_at desc);
create index if not exists idx_favorites_profile_id on public.favorites(profile_id);
create index if not exists idx_watch_progress_profile_id on public.watch_progress(profile_id);
create index if not exists idx_recommendation_logs_profile_id on public.recommendation_logs(profile_id);
create index if not exists idx_user_preferences_profile_id on public.user_preferences(profile_id);
create unique index if not exists favorites_user_movie_profile_unique
on public.favorites(user_id, movie_id, profile_id);
create unique index if not exists watch_progress_user_movie_profile_unique
on public.watch_progress(user_id, movie_id, profile_id);

drop index if exists user_preferences_user_action_genre_profile_unique;
create unique index user_preferences_user_action_genre_profile_unique
on public.user_preferences(user_id, action, genre_id, profile_id);

create or replace function public.refresh_user_preferences(
  target_user_id uuid,
  target_profile_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_preferences
  where user_id = target_user_id
    and (target_profile_id is null or profile_id = target_profile_id)
    and action in ('favorite', 'watch', 'complete');

  insert into public.user_preferences (user_id, profile_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    target_profile_id,
    'favorite',
    mg.genre_id,
    greatest(1, count(*)::integer * 24),
    jsonb_build_object('source', 'favorites'),
    now()
  from public.favorites f
  join public.movie_genres mg on mg.movie_id = f.movie_id
  where f.user_id = target_user_id
    and (target_profile_id is null or f.profile_id = target_profile_id)
  group by mg.genre_id
  on conflict (user_id, action, genre_id, profile_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.user_preferences (user_id, profile_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    target_profile_id,
    'watch',
    mg.genre_id,
    greatest(1, round(sum(least(1, wp.progress_seconds::numeric / nullif(wp.duration_seconds, 0))) * 18)::integer),
    jsonb_build_object('source', 'watch_progress'),
    now()
  from public.watch_progress wp
  join public.movie_genres mg on mg.movie_id = wp.movie_id
  where wp.user_id = target_user_id
    and (target_profile_id is null or wp.profile_id = target_profile_id)
    and wp.duration_seconds > 0
    and wp.progress_seconds > 0
  group by mg.genre_id
  on conflict (user_id, action, genre_id, profile_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.user_preferences (user_id, profile_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    target_profile_id,
    'complete',
    mg.genre_id,
    greatest(1, count(*)::integer * 32),
    jsonb_build_object('source', 'completed_titles'),
    now()
  from public.watch_progress wp
  join public.movie_genres mg on mg.movie_id = wp.movie_id
  where wp.user_id = target_user_id
    and (target_profile_id is null or wp.profile_id = target_profile_id)
    and wp.duration_seconds > 0
    and wp.progress_seconds::numeric / nullif(wp.duration_seconds, 0) >= 0.85
  group by mg.genre_id
  on conflict (user_id, action, genre_id, profile_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();
end;
$$;

create or replace function public.record_recommendation_event(
  p_user_id uuid,
  p_profile_id uuid,
  p_movie_id uuid,
  p_event text,
  p_section_slug text default 'unknown',
  p_recommendation_score numeric default 0,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_movie_id is null then
    return;
  end if;

  if p_user_id is not null and auth.uid() <> p_user_id and not public.is_admin() then
    raise exception 'Not allowed to record recommendation event for another user';
  end if;

  if p_profile_id is not null and not exists (
    select 1 from public.viewer_profiles
    where id = p_profile_id
      and user_id = p_user_id
  ) then
    raise exception 'Profile does not belong to user';
  end if;

  insert into public.recommendation_logs (
    user_id,
    profile_id,
    movie_id,
    section_slug,
    recommendation_score,
    reason,
    event,
    metadata,
    created_at
  )
  values (
    p_user_id,
    p_profile_id,
    p_movie_id,
    coalesce(nullif(p_section_slug, ''), 'unknown'),
    coalesce(p_recommendation_score, 0),
    p_reason,
    coalesce(nullif(p_event, ''), 'unknown'),
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );

  perform public.refresh_content_score(p_movie_id);

  if p_user_id is not null and p_event in ('shown', 'clicked', 'play', 'progress', 'completed', 'favorite_added', 'favorite_removed') then
    perform public.refresh_user_preferences(p_user_id, p_profile_id);
    perform public.refresh_user_similarity(p_user_id);
  end if;

  perform public.refresh_content_trending('7d', 'all');
end;
$$;

grant execute on function public.record_recommendation_event(uuid, uuid, uuid, text, text, numeric, text, jsonb) to authenticated;

alter table public.accounts enable row level security;
alter table public.viewer_profiles enable row level security;

drop policy if exists "Users can read own account" on public.accounts;
create policy "Users can read own account"
on public.accounts for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can create own account" on public.accounts;
create policy "Users can create own account"
on public.accounts for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Users can update own account" on public.accounts;
create policy "Users can update own account"
on public.accounts for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Users can read own viewer profiles" on public.viewer_profiles;
create policy "Users can read own viewer profiles"
on public.viewer_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own viewer profiles" on public.viewer_profiles;
create policy "Users can create own viewer profiles"
on public.viewer_profiles for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.accounts
    where accounts.id = viewer_profiles.account_id
      and accounts.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update own viewer profiles" on public.viewer_profiles;
create policy "Users can update own viewer profiles"
on public.viewer_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own viewer profiles" on public.viewer_profiles;
create policy "Users can delete own viewer profiles"
on public.viewer_profiles for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_accounts_updated_at on public.accounts;
create trigger touch_accounts_updated_at
before update on public.accounts
for each row execute function public.touch_updated_at();

drop trigger if exists touch_viewer_profiles_updated_at on public.viewer_profiles;
create trigger touch_viewer_profiles_updated_at
before update on public.viewer_profiles
for each row execute function public.touch_updated_at();
