import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import { getAdminHomeSections } from "@/services/admin-service";
import type { Genre, Movie } from "@/types/domain";

export type AdminCurationViewHint = "cards" | "list" | "editorial" | "browse";

export type AdminCurationGenre = {
  genre: Genre & { active: boolean; color: string; icon: string; sortOrder: number };
  updatedAt?: string;
  movieCount: number;
  seriesCount: number;
  preview: Movie[];
  homeUsage: { inHome: boolean; rails: string[] };
  warnings: string[];
};

export type AdminCurationIndex = {
  updatedAt: string;
  totals: {
    genres: number;
    active: number;
    inactive: number;
    empty: number;
  };
  items: AdminCurationGenre[];
};

type GenreRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  active: boolean | null;
  sort_order: number | null;
  updated_at?: string | null;
};

type MovieRow = {
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
  updated_at?: string | null;
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

function mapMovie(row: MovieRow): Movie {
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
    durationMinutes: row.duration_minutes ?? 90,
    maturityRating: row.maturity_rating ?? "L",
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

function pickPreview(movies: Movie[]) {
  return [...movies]
    .filter((movie) => movie.status === "published")
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating || b.releaseYear - a.releaseYear)
    .slice(0, 8);
}

function computeWarnings({
  movieCount,
  seriesCount,
  homeUsage,
  updatedAt,
}: {
  movieCount: number;
  seriesCount: number;
  homeUsage: AdminCurationGenre["homeUsage"];
  updatedAt?: string;
}) {
  const warnings: string[] = [];
  if (movieCount + seriesCount === 0) warnings.push("Categoria vazia");
  if (movieCount + seriesCount === 1) warnings.push("Apenas 1 conteudo");
  if (!homeUsage.inHome) warnings.push("Nao aparece na Home");
  if (!updatedAt) warnings.push("Sem data de atualizacao");
  return warnings;
}

export async function getAdminCurationIndex(): Promise<AdminCurationIndex> {
  const [homeSections, catalog] = await Promise.all([getAdminHomeSections(), getCatalogMovies({ includeDrafts: true })]);

  const railsByMovieId = new Map<string, string[]>();
  for (const section of homeSections) {
    for (const item of section.items) {
      const movieId = item.movie?.id;
      if (!movieId) continue;
      const current = railsByMovieId.get(movieId) ?? [];
      if (!current.includes(section.title)) current.push(section.title);
      railsByMovieId.set(movieId, current);
    }
  }

  if (!hasSupabaseEnv()) {
    // Minimal fallback: derive genres from catalog + mock list from admin-service fallback.
    const byGenreSlug = new Map<string, { genre: Genre; movies: Movie[] }>();
    for (const movie of catalog) {
      for (const genre of movie.genres) {
        const current = byGenreSlug.get(genre.slug) ?? { genre: { ...genre }, movies: [] };
        current.movies.push(movie);
        byGenreSlug.set(genre.slug, current);
      }
    }

    const updatedAt = new Date().toISOString();
    const items: AdminCurationGenre[] = Array.from(byGenreSlug.values())
      .map((entry, index) => {
        const preview = pickPreview(entry.movies);
        const movieCount = entry.movies.filter((m) => m.type === "movie").length;
        const seriesCount = entry.movies.filter((m) => m.type === "series").length;
        const rails = Array.from(
          new Set(entry.movies.flatMap((m) => railsByMovieId.get(m.id) ?? [])),
        );
        const homeUsage = { inHome: rails.length > 0, rails };
        const warnings = computeWarnings({ movieCount, seriesCount, homeUsage, updatedAt });
        return {
          genre: {
            id: entry.genre.id || `demo-${index}`,
            name: entry.genre.name,
            slug: entry.genre.slug,
            color: entry.genre.color ?? "#13c8ff",
            icon: entry.genre.icon ?? "film",
            active: entry.genre.active ?? true,
            sortOrder: entry.genre.sortOrder ?? index,
          },
          updatedAt,
          movieCount,
          seriesCount,
          preview,
          homeUsage,
          warnings,
        };
      })
      .sort((a, b) => a.genre.sortOrder - b.genre.sortOrder || a.genre.name.localeCompare(b.genre.name));

    return {
      updatedAt,
      totals: {
        genres: items.length,
        active: items.filter((i) => i.genre.active).length,
        inactive: items.filter((i) => !i.genre.active).length,
        empty: items.filter((i) => i.movieCount + i.seriesCount === 0).length,
      },
      items,
    };
  }

  const supabase = await createSupabaseServerClient();

  // Try to read updated_at if exists; fall back if the column isn't present.
  let genreData: GenreRow[] = [];
  const withUpdated = await supabase
    .from("genres")
    .select("id, name, slug, color, icon, active, sort_order, updated_at")
    .order("sort_order", { ascending: true });
  if (!withUpdated.error && withUpdated.data) {
    genreData = withUpdated.data as unknown as GenreRow[];
  } else {
    const withoutUpdated = await supabase
      .from("genres")
      .select("id, name, slug, color, icon, active, sort_order")
      .order("sort_order", { ascending: true });
    if (withoutUpdated.error) throw withoutUpdated.error;
    genreData = (withoutUpdated.data ?? []) as unknown as GenreRow[];
  }

  const { data: movieData, error: movieError } = await supabase
    .from("movies")
    .select("id, title, slug, description, type, poster_url, backdrop_url, trailer_url, mux_playback_id, release_year, duration_minutes, maturity_rating, rating, featured, status, updated_at, movie_genres(genres(id, name, slug))")
    .order("updated_at", { ascending: false });

  if (movieError) throw movieError;
  const movies = (movieData ?? []) as unknown as MovieRow[];
  const mappedMovies = movies.map((row) => mapMovie(row));
  const moviesById = new Map(mappedMovies.map((m) => [m.id, m]));

  const byGenreId = new Map<string, { movies: Movie[]; updatedAt?: string }>();
  for (const row of movies) {
    const movie = moviesById.get(row.id);
    if (!movie) continue;
    for (const rel of row.movie_genres ?? []) {
      const genre = rel.genres;
      if (!genre) continue;
      const current = byGenreId.get(genre.id) ?? { movies: [], updatedAt: undefined };
      current.movies.push(movie);
      byGenreId.set(genre.id, current);
    }
  }

  const items: AdminCurationGenre[] = genreData.map((row, index) => {
    const entry = byGenreId.get(row.id) ?? { movies: [] as Movie[] };
    const preview = pickPreview(entry.movies);
    const movieCount = entry.movies.filter((m) => m.type === "movie").length;
    const seriesCount = entry.movies.filter((m) => m.type === "series").length;
    const rails = Array.from(new Set(entry.movies.flatMap((m) => railsByMovieId.get(m.id) ?? [])));
    const homeUsage = { inHome: rails.length > 0, rails };
    const updatedAt = row.updated_at ?? undefined;
    const warnings = computeWarnings({ movieCount, seriesCount, homeUsage, updatedAt });

    return {
      genre: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        color: row.color ?? "#13c8ff",
        icon: row.icon ?? "film",
        active: row.active ?? true,
        sortOrder: row.sort_order ?? index,
      },
      updatedAt,
      movieCount,
      seriesCount,
      preview,
      homeUsage,
      warnings,
    };
  });

  const updatedAt = new Date().toISOString();
  return {
    updatedAt,
    totals: {
      genres: items.length,
      active: items.filter((i) => i.genre.active).length,
      inactive: items.filter((i) => !i.genre.active).length,
      empty: items.filter((i) => i.movieCount + i.seriesCount === 0).length,
    },
    items,
  };
}

