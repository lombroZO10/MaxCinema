-- MaxCinema Intelligence Engine synchronization.
-- Adds recommendation-backed Home Sections and richer recommendation analytics.

alter type public.home_section_source_type add value if not exists 'recommendation';

alter table public.home_sections
  add column if not exists source_key text,
  add column if not exists subtitle text;

create index if not exists home_sections_recommendation_source_idx
  on public.home_sections (source_type, source_key, position);

alter table public.recommendation_logs
  add column if not exists section_title text,
  add column if not exists event_type text,
  add column if not exists profile_id uuid references public.viewer_profiles(id) on delete cascade;

update public.recommendation_logs
set event_type = event
where event_type is null;

alter table public.recommendation_logs
  alter column event_type set default 'view';

create index if not exists recommendation_logs_section_event_idx
  on public.recommendation_logs (section_slug, event_type, created_at desc);

create index if not exists recommendation_logs_profile_event_idx
  on public.recommendation_logs (profile_id, event_type, created_at desc)
  where profile_id is not null;

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

create index if not exists content_views_movie_created_idx
  on public.content_views (movie_id, created_at desc);

create index if not exists content_views_profile_created_idx
  on public.content_views (profile_id, created_at desc)
  where profile_id is not null;

alter table public.content_views enable row level security;

drop policy if exists "Users read own content views" on public.content_views;
create policy "Users read own content views"
  on public.content_views
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users write own content views" on public.content_views;
create policy "Users write own content views"
  on public.content_views
  for insert
  with check (auth.uid() = user_id or public.is_admin());

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
declare
  normalized_event text;
  display_event text;
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

  normalized_event := coalesce(nullif(p_event, ''), 'view');
  display_event := case
    when normalized_event = 'shown' then 'view'
    when normalized_event = 'clicked' then 'click'
    else normalized_event
  end;

  insert into public.recommendation_logs (
    user_id,
    profile_id,
    movie_id,
    section_slug,
    section_title,
    recommendation_score,
    reason,
    event,
    event_type,
    metadata,
    created_at
  )
  values (
    p_user_id,
    p_profile_id,
    p_movie_id,
    coalesce(nullif(p_section_slug, ''), 'unknown'),
    p_metadata ->> 'sectionTitle',
    coalesce(p_recommendation_score, 0),
    p_reason,
    normalized_event,
    display_event,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );

  perform public.refresh_content_score(p_movie_id);

  if p_user_id is not null and normalized_event in ('shown', 'clicked', 'view', 'click', 'play', 'progress', 'completed', 'favorite_added', 'favorite_removed') then
    perform public.refresh_user_preferences(p_user_id, p_profile_id);
    perform public.refresh_user_similarity(p_user_id);
  end if;

  perform public.refresh_content_trending('7d', 'all');
end;
$$;

grant execute on function public.record_recommendation_event(uuid, uuid, uuid, text, text, numeric, text, jsonb) to authenticated;

insert into public.site_settings (key, value, "group", type, label, description, is_public)
values
  (
    'intelligence.engine',
    '{"enabled":true,"version":"2026.2","sourceOfTruth":["movies","genres","favorites","watch_progress","collections","home_sections","recommendation_logs","user_preferences","content_views"],"dedupeFirstRows":3}',
    'advanced',
    'json',
    'Intelligence Engine',
    'Configuracao operacional da recommendation engine.',
    false
  )
on conflict (key) do update set
  value = excluded.value,
  "group" = excluded."group",
  type = excluded.type,
  label = excluded.label,
  description = excluded.description,
  is_public = excluded.is_public;
