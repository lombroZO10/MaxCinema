-- Media upload hardening for admin/server-action uploads.
-- Keeps storage metadata queryable and rejects impossible asset rows.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_size_non_negative'
  ) then
    alter table public.media_assets
      add constraint media_assets_size_non_negative
      check (size is null or size >= 0) not valid;
  end if;
end $$;

alter table public.media_assets validate constraint media_assets_size_non_negative;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_bucket_not_blank'
  ) then
    alter table public.media_assets
      add constraint media_assets_bucket_not_blank
      check (length(trim(bucket)) > 0) not valid;
  end if;
end $$;

alter table public.media_assets validate constraint media_assets_bucket_not_blank;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_usage_not_blank'
  ) then
    alter table public.media_assets
      add constraint media_assets_usage_not_blank
      check (usage is null or length(trim(usage)) > 0) not valid;
  end if;
end $$;

alter table public.media_assets validate constraint media_assets_usage_not_blank;

create index if not exists media_assets_bucket_path_idx
  on public.media_assets (bucket, path);

create index if not exists media_assets_mime_created_idx
  on public.media_assets (mime_type, created_at desc)
  where mime_type is not null;

insert into public.site_settings (key, value, "group", type, label, description, is_public)
values
  ('media.maxPosterMb', '10', 'media', 'number', 'Poster maximo MB', 'Limite operacional para upload de poster.', false),
  ('media.maxBackdropMb', '12', 'media', 'number', 'Backdrop maximo MB', 'Limite operacional para backdrop e banners.', false),
  ('media.allowedImageFormats', '"jpg,jpeg,png,webp,avif"', 'media', 'string', 'Formatos de imagem', 'Formatos aceitos separados por virgula.', false),
  ('media.storageBucket', '"media"', 'media', 'string', 'Bucket de storage', 'Bucket padrao de uploads.', false)
on conflict (key) do update set
  "group" = excluded."group",
  type = excluded.type,
  label = excluded.label,
  description = excluded.description,
  is_public = excluded.is_public;
