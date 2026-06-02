import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies, getMovieById } from "@/services/catalog-service";
import { progress as mockProgress } from "@/services/content-service";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import type { Movie, WatchProgress } from "@/types/domain";

export async function getCurrentUserId() {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getFavoriteMovieIds() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = await createSupabaseServerClient();
  const activeProfile = await getActiveViewerProfile();
  if (!activeProfile) return [];
  let query = supabase
    .from("favorites")
    .select("movie_id")
    .eq("user_id", userId);

  query = query.eq("profile_id", activeProfile.id);

  const { data, error } = await query;

  if (error) return [];
  return (data ?? []).map((favorite) => favorite.movie_id as string);
}

export async function getFavoriteMovies() {
  const ids = await getFavoriteMovieIds();
  if (!ids.length) return [];

  const movies = await Promise.all(ids.map((id) => getMovieById(id)));
  return movies.filter((movie): movie is Movie => Boolean(movie));
}

export async function getWatchProgressItems() {
  const userId = await getCurrentUserId();

  if (!userId) {
    const fallback = await Promise.all(
      mockProgress.map(async (item) => ({ item, movie: await getMovieById(item.movieId) })),
    );
    return fallback.filter((entry): entry is { item: WatchProgress; movie: Movie } => Boolean(entry.movie));
  }

  const supabase = await createSupabaseServerClient();
  const activeProfile = await getActiveViewerProfile();
  if (!activeProfile) return [];
  let query = supabase
    .from("watch_progress")
    .select("movie_id, progress_seconds, duration_seconds, updated_at")
    .eq("user_id", userId)
    .gt("progress_seconds", 0);

  query = query.eq("profile_id", activeProfile.id);

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(24);

  if (error || !data?.length) return [];

  const items = await Promise.all(
    data.map(async (row) => {
      const movie = await getMovieById(row.movie_id);
      if (!movie) return null;

      const remaining = Math.max(0, Math.round((row.duration_seconds - row.progress_seconds) / 60));
      const label = remaining >= 60
        ? `${Math.floor(remaining / 60)}h ${remaining % 60}m restantes`
        : `${remaining}m restantes`;

      return {
        movie,
        item: {
          movieId: row.movie_id,
          progressSeconds: row.progress_seconds,
          durationSeconds: row.duration_seconds,
          label,
        },
      };
    }),
  );

  return items.filter((entry): entry is { item: WatchProgress; movie: Movie } => Boolean(entry));
}

export async function getMovieProgress(movieId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  const activeProfile = await getActiveViewerProfile();
  if (!activeProfile) return null;
  let query = supabase
    .from("watch_progress")
    .select("progress_seconds, duration_seconds")
    .eq("user_id", userId)
    .eq("movie_id", movieId);

  query = query.eq("profile_id", activeProfile.id);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;
  return {
    progressSeconds: data.progress_seconds,
    durationSeconds: data.duration_seconds,
  };
}

export async function getCatalogWithFavorites() {
  const [movies, favoriteIds] = await Promise.all([getCatalogMovies(), getFavoriteMovieIds()]);
  return { movies, favoriteIds };
}
