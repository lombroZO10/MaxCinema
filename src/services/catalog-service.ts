import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFeaturedMovie as getMockFeaturedMovie,
  getMovieById as getMockMovieById,
  getMovieBySlug as getMockMovieBySlug,
  getRails as getMockRails,
  movies as mockMovies,
} from "@/services/content-service";
import type { Movie } from "@/types/domain";

type MovieRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: "movie" | "series";
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  mux_playback_id: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  maturity_rating: string | null;
  featured: boolean;
  status: "draft" | "published";
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

function mapMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
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
    rating: 8.8,
    cast: [],
    genres:
      row.movie_genres
        ?.map((item) => item.genres)
        .filter((genre): genre is NonNullable<typeof genre> => Boolean(genre)) ?? [],
  };
}

async function fetchMoviesFromSupabase({ includeDrafts = false } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("movies")
    .select("*, movie_genres(genres(id, name, slug))")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapMovie(row as MovieRow));
}

export async function getCatalogMovies({ includeDrafts = false } = {}) {
  if (!hasSupabaseEnv()) return mockMovies;

  try {
    const movies = await fetchMoviesFromSupabase({ includeDrafts });
    return movies.length ? movies : mockMovies;
  } catch {
    return mockMovies;
  }
}

export async function getFeaturedMovie() {
  const movies = await getCatalogMovies();
  return movies.find((movie) => movie.featured) ?? movies[0] ?? getMockFeaturedMovie();
}

export async function getMovieBySlug(slug: string) {
  if (!hasSupabaseEnv()) return getMockMovieBySlug(slug);
  const movies = await getCatalogMovies({ includeDrafts: true });
  return movies.find((movie) => movie.slug === slug) ?? getMockMovieBySlug(slug);
}

export async function getMovieById(id: string) {
  if (!hasSupabaseEnv()) return getMockMovieById(id);
  const movies = await getCatalogMovies({ includeDrafts: true });
  return movies.find((movie) => movie.id === id) ?? getMockMovieById(id);
}

export async function getRails() {
  const movies = await getCatalogMovies();

  if (!hasSupabaseEnv() || movies.length < 4) {
    return getMockRails();
  }

  return [
    { title: "Populares no MaxCinema", movies },
    { title: "Originais MaxCinema", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "original")) },
    { title: "Lancamentos", movies: [...movies].sort((a, b) => b.releaseYear - a.releaseYear) },
    { title: "Sci-fi de alto impacto", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "sci-fi")) },
  ].filter((rail) => rail.movies.length);
}
