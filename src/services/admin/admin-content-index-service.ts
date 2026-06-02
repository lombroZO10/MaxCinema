import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import { getAdminHomeSections } from "@/services/admin-service";
import type { Movie } from "@/types/domain";

export type AdminContentIssue =
  | "poster"
  | "backdrop"
  | "trailer"
  | "description"
  | "genre"
  | "rating"
  | "duration"
  | "slug";

export type ContentHealth = "green" | "amber" | "red";

export type AdminContentIndexItem = {
  movie: Movie;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  favoriteCount: number;
  watchedMinutes: number;
  viewCount: number;
  completionRate: number;
  issues: AdminContentIssue[];
  qualityScore: number;
  health: ContentHealth;
  appearsIn: { hero: boolean; sections: string[] };
};

export type AdminContentIndex = {
  items: AdminContentIndexItem[];
  updatedAt: string;
};

type AdminMovieRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "movie" | "series";
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  mux_playback_id: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  maturity_rating: string | null;
  rating?: number | null;
  featured: boolean;
  status: "draft" | "published";
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

function mapMovie(row: AdminMovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    type: row.type,
    posterUrl: row.poster_url ?? "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&h=1350&q=86",
    backdropUrl: row.backdrop_url ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86",
    trailerUrl: row.trailer_url ?? undefined,
    muxPlaybackId: row.mux_playback_id ?? undefined,
    releaseYear: row.release_year ?? new Date().getFullYear(),
    durationMinutes: row.duration_minutes ?? 0,
    maturityRating: row.maturity_rating ?? "",
    featured: row.featured,
    status: row.status,
    rating: row.rating ?? 0,
    cast: [],
    genres:
      row.movie_genres
        ?.map((item) => item.genres)
        .filter((genre): genre is NonNullable<typeof genre> => Boolean(genre)) ?? [],
  };
}

function getIssues(movie: Movie, row: AdminMovieRow): AdminContentIssue[] {
  const issues: AdminContentIssue[] = [];
  if (!row.poster_url) issues.push("poster");
  if (!row.backdrop_url) issues.push("backdrop");
  if (!row.trailer_url && !row.mux_playback_id) issues.push("trailer");
  if (!row.description || row.description.trim().length < 40) issues.push("description");
  if (!row.movie_genres?.some((item) => item.genres)) issues.push("genre");
  if (!row.maturity_rating) issues.push("rating");
  if (!row.duration_minutes) issues.push("duration");
  if (!movie.slug?.trim()) issues.push("slug");
  return issues;
}

function computeQuality(issues: AdminContentIssue[]) {
  const max = 8;
  const missing = issues.length;
  const score = Math.max(0, Math.min(100, Math.round(((max - missing) / max) * 100)));
  const health: ContentHealth = missing === 0 ? "green" : missing <= 2 ? "amber" : "red";
  return { score, health } as const;
}

export async function getAdminContentIndex(): Promise<AdminContentIndex> {
  const homeSections = await getAdminHomeSections();
  const appearsByMovieId = new Map<string, { hero: boolean; sections: string[] }>();

  for (const section of homeSections) {
    for (const item of section.items) {
      const movieId = item.movie?.id;
      if (!movieId) continue;
      const current = appearsByMovieId.get(movieId) ?? { hero: false, sections: [] };
      current.hero = current.hero || section.type === "hero";
      if (!current.sections.includes(section.title)) current.sections.push(section.title);
      appearsByMovieId.set(movieId, current);
    }
  }

  if (!hasSupabaseEnv()) {
    const movies = await getCatalogMovies({ includeDrafts: true });
    const updatedAt = new Date().toISOString();
    const items = movies.map((movie) => {
      const issues = (() => {
        const localIssues: AdminContentIssue[] = [];
        if (!movie.posterUrl) localIssues.push("poster");
        if (!movie.backdropUrl) localIssues.push("backdrop");
        if (!movie.trailerUrl && !movie.muxPlaybackId) localIssues.push("trailer");
        if (!movie.description || movie.description.trim().length < 40) localIssues.push("description");
        if (!movie.genres?.length) localIssues.push("genre");
        if (!movie.maturityRating) localIssues.push("rating");
        if (!movie.durationMinutes) localIssues.push("duration");
        if (!movie.slug?.trim()) localIssues.push("slug");
        return localIssues;
      })();
      const quality = computeQuality(issues);
      return {
        movie,
        favoriteCount: 0,
        watchedMinutes: 0,
        viewCount: 0,
        completionRate: 0,
        issues,
        qualityScore: quality.score,
        health: quality.health,
        appearsIn: appearsByMovieId.get(movie.id) ?? { hero: false, sections: [] },
      } satisfies AdminContentIndexItem;
    });

    return { items, updatedAt };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("movies")
    .select(
      `
      id,
      title,
      slug,
      description,
      type,
      poster_url,
      backdrop_url,
      trailer_url,
      mux_playback_id,
      release_year,
      duration_minutes,
      maturity_rating,
      rating,
      featured,
      status,
      created_at,
      updated_at,
      published_at,
      movie_genres(genres(id, name, slug))
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as AdminMovieRow[];
  const ids = rows.map((row) => row.id);
  const favoriteCounts = new Map<string, number>();
  const watchSignals = new Map<string, { minutes: number; views: number }>();

  if (ids.length) {
    const [favoritesResponse, progressResponse] = await Promise.all([
      supabase.from("favorites").select("movie_id").in("movie_id", ids),
      supabase.from("watch_progress").select("movie_id, progress_seconds").in("movie_id", ids),
    ]);

    if (!favoritesResponse.error) {
      for (const favorite of favoritesResponse.data ?? []) {
        const movieId = favorite.movie_id as string;
        favoriteCounts.set(movieId, (favoriteCounts.get(movieId) ?? 0) + 1);
      }
    }

    if (!progressResponse.error) {
      for (const item of progressResponse.data ?? []) {
        const movieId = item.movie_id as string;
        const current = watchSignals.get(movieId) ?? { minutes: 0, views: 0 };
        watchSignals.set(movieId, {
          minutes: current.minutes + Math.floor(Number(item.progress_seconds ?? 0) / 60),
          views: current.views + 1,
        });
      }
    }
  }

  const items = rows.map((row) => {
    const movie = mapMovie(row);
    const watch = watchSignals.get(row.id) ?? { minutes: 0, views: 0 };
    const duration = Math.max(movie.durationMinutes, 1);
    const completionRate = watch.views ? Math.min(100, Math.round((watch.minutes / (duration * watch.views)) * 100)) : 0;
    const issues = getIssues(movie, row);
    const quality = computeQuality(issues);

    return {
      movie,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      publishedAt: row.published_at ?? undefined,
      favoriteCount: favoriteCounts.get(row.id) ?? 0,
      watchedMinutes: watch.minutes,
      viewCount: watch.views,
      completionRate,
      issues,
      qualityScore: quality.score,
      health: quality.health,
      appearsIn: appearsByMovieId.get(row.id) ?? { hero: false, sections: [] },
    } satisfies AdminContentIndexItem;
  });

  return {
    items,
    updatedAt: items[0]?.updatedAt ?? new Date().toISOString(),
  };
}
