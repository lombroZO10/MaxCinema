create index if not exists favorites_movie_idx on public.favorites (movie_id);
create index if not exists watch_progress_movie_idx on public.watch_progress (movie_id);
create index if not exists watch_progress_user_idx on public.watch_progress (user_id, updated_at desc);
create index if not exists movie_genres_genre_idx on public.movie_genres (genre_id, movie_id);

create or replace function public.refresh_content_score(target_movie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base_rating numeric(7,2);
  favorite_count integer;
  progress_count integer;
  completion_count integer;
  total_minutes numeric(12,2);
  shown_count integer;
  click_count integer;
  play_count integer;
  popularity numeric(7,2);
  quality numeric(7,2);
  completion numeric(7,2);
  favorite numeric(7,2);
  recommendation numeric(7,2);
begin
  select coalesce(rating, 8.0)
    into base_rating
  from public.movies
  where id = target_movie_id;

  if base_rating is null then
    return;
  end if;

  select count(*) into favorite_count
  from public.favorites
  where movie_id = target_movie_id;

  select
    count(*),
    count(*) filter (
      where duration_seconds > 0
        and progress_seconds::numeric / nullif(duration_seconds, 0) >= 0.85
    ),
    coalesce(sum(progress_seconds), 0)::numeric / 60
    into progress_count, completion_count, total_minutes
  from public.watch_progress
  where movie_id = target_movie_id;

  select
    count(*) filter (where event = 'shown'),
    count(*) filter (where event = 'clicked'),
    count(*) filter (where event = 'play')
    into shown_count, click_count, play_count
  from public.recommendation_logs
  where movie_id = target_movie_id;

  popularity := least(100, favorite_count * 12 + progress_count * 7 + play_count * 5 + click_count * 3 + greatest(total_minutes, 0) * 0.15);
  quality := least(100, base_rating * 10);
  completion := case when progress_count > 0 then least(100, completion_count::numeric / progress_count * 100) else 0 end;
  favorite := least(100, favorite_count * 18);
  recommendation := round((popularity * 0.35) + (quality * 0.25) + (completion * 0.2) + (favorite * 0.2), 2);

  insert into public.content_scores (
    movie_id,
    popularity_score,
    quality_score,
    completion_score,
    favorite_score,
    recommendation_score,
    updated_at
  )
  values (
    target_movie_id,
    popularity,
    quality,
    completion,
    favorite,
    recommendation,
    now()
  )
  on conflict (movie_id) do update set
    popularity_score = excluded.popularity_score,
    quality_score = excluded.quality_score,
    completion_score = excluded.completion_score,
    favorite_score = excluded.favorite_score,
    recommendation_score = excluded.recommendation_score,
    updated_at = now();
end;
$$;

create or replace function public.refresh_user_preferences(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_preferences
  where user_id = target_user_id
    and action in ('favorite', 'watch', 'complete');

  insert into public.user_preferences (user_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    'favorite',
    mg.genre_id,
    greatest(1, count(*)::integer * 24),
    jsonb_build_object('source', 'favorites'),
    now()
  from public.favorites f
  join public.movie_genres mg on mg.movie_id = f.movie_id
  where f.user_id = target_user_id
  group by mg.genre_id
  on conflict (user_id, action, genre_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.user_preferences (user_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    'watch',
    mg.genre_id,
    greatest(1, round(sum(least(1, wp.progress_seconds::numeric / nullif(wp.duration_seconds, 0))) * 18)::integer),
    jsonb_build_object('source', 'watch_progress'),
    now()
  from public.watch_progress wp
  join public.movie_genres mg on mg.movie_id = wp.movie_id
  where wp.user_id = target_user_id
    and wp.duration_seconds > 0
    and wp.progress_seconds > 0
  group by mg.genre_id
  on conflict (user_id, action, genre_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.user_preferences (user_id, action, genre_id, score, metadata, updated_at)
  select
    target_user_id,
    'complete',
    mg.genre_id,
    greatest(1, count(*)::integer * 32),
    jsonb_build_object('source', 'completed_titles'),
    now()
  from public.watch_progress wp
  join public.movie_genres mg on mg.movie_id = wp.movie_id
  where wp.user_id = target_user_id
    and wp.duration_seconds > 0
    and wp.progress_seconds::numeric / nullif(wp.duration_seconds, 0) >= 0.85
  group by mg.genre_id
  on conflict (user_id, action, genre_id) do update set
    score = excluded.score,
    metadata = excluded.metadata,
    updated_at = now();
end;
$$;

create or replace function public.refresh_user_similarity(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_similarity
  where user_id = target_user_id;

  insert into public.user_similarity (user_id, similar_user_id, similarity_score, updated_at)
  with target_pref as (
    select genre_id, sum(score)::numeric as score
    from public.user_preferences
    where user_id = target_user_id
    group by genre_id
  ),
  other_pref as (
    select user_id, genre_id, sum(score)::numeric as score
    from public.user_preferences
    where user_id <> target_user_id
    group by user_id, genre_id
  ),
  scored as (
    select
      op.user_id as similar_user_id,
      round(
        least(
          100,
          (sum(least(tp.score, op.score)) / nullif(sum(greatest(tp.score, op.score)), 0)) * 100
        ),
        2
      ) as similarity_score
    from target_pref tp
    join other_pref op on op.genre_id = tp.genre_id
    group by op.user_id
  )
  select target_user_id, similar_user_id, coalesce(similarity_score, 0), now()
  from scored
  where similarity_score > 0
  order by similarity_score desc
  limit 20
  on conflict (user_id, similar_user_id) do update set
    similarity_score = excluded.similarity_score,
    updated_at = now();
end;
$$;

create or replace function public.refresh_content_trending(target_period text default '7d', target_category text default 'all')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.content_trending
  where period = target_period
    and category = target_category;

  insert into public.content_trending (movie_id, period, category, rank, trend_score, started_at, updated_at)
  select
    ranked.movie_id,
    target_period,
    target_category,
    ranked.rank,
    ranked.trend_score,
    now(),
    now()
  from (
    select
      m.id as movie_id,
      row_number() over (
        order by
          (
            coalesce(cs.recommendation_score, 0) * 0.62
            + coalesce(cs.popularity_score, 0) * 0.28
            + case when m.release_year >= extract(year from now())::int - 1 then 8 else 0 end
            + case when m.featured then 6 else 0 end
          ) desc,
          m.created_at desc
      )::integer as rank,
      round(
        (
          coalesce(cs.recommendation_score, 0) * 0.62
          + coalesce(cs.popularity_score, 0) * 0.28
          + case when m.release_year >= extract(year from now())::int - 1 then 8 else 0 end
          + case when m.featured then 6 else 0 end
        ),
        2
      ) as trend_score
    from public.movies m
    left join public.content_scores cs on cs.movie_id = m.id
    where m.status = 'published'
  ) ranked
  where ranked.rank <= 50;
end;
$$;

create or replace function public.record_recommendation_event(
  p_user_id uuid,
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

  insert into public.recommendation_logs (
    user_id,
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
    perform public.refresh_user_preferences(p_user_id);
    perform public.refresh_user_similarity(p_user_id);
  end if;

  perform public.refresh_content_trending('7d', 'all');
end;
$$;

create or replace function public.rebuild_recommendation_rankings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  movie_record record;
  user_record record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can rebuild recommendation rankings';
  end if;

  for movie_record in select id from public.movies loop
    perform public.refresh_content_score(movie_record.id);
  end loop;

  for user_record in select id from auth.users loop
    perform public.refresh_user_preferences(user_record.id);
    perform public.refresh_user_similarity(user_record.id);
  end loop;

  perform public.refresh_content_trending('7d', 'all');
  perform public.refresh_content_trending('24h', 'all');
end;
$$;

grant execute on function public.record_recommendation_event(uuid, uuid, text, text, numeric, text, jsonb) to authenticated;
grant execute on function public.rebuild_recommendation_rankings() to authenticated;
