create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

create index if not exists watch_progress_user_updated_idx
  on public.watch_progress (user_id, updated_at desc);

drop trigger if exists watch_progress_touch_updated_at on public.watch_progress;
create trigger watch_progress_touch_updated_at
  before update on public.watch_progress
  for each row execute function public.touch_updated_at();
