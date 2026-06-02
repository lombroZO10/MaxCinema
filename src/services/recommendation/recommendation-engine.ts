import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import { movies as mockMovies } from "@/services/content-service";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { getCurrentUserId, getFavoriteMovieIds, getWatchProgressItems } from "@/services/user-library-service";
import { buildPersonalizedRows } from "@/services/recommendation/recommendation-builder";
import { buildSimilaritySignals } from "@/services/recommendation/recommendation-similarity";
import { buildTrending } from "@/services/recommendation/recommendation-trending";
import type { Movie, WatchProgress } from "@/types/domain";

export async function getMaxCinemaIntelligence() {
  const [movies, favoriteIds, progressItems] = await Promise.all([
    getCatalogMovies(),
    getFavoriteMovieIds(),
    getWatchProgressItems(),
  ]);

  const signals = await getLiveRecommendationSignals(movies);
  return buildMaxCinemaIntelligence({ movies, favoriteIds, progressItems, signals });
}

export function buildMaxCinemaIntelligence({
  movies,
  favoriteIds,
  progressItems,
  signals = createEmptySignals(),
}: {
  movies: Movie[];
  favoriteIds: string[];
  progressItems: { item: WatchProgress; movie: Movie }[];
  signals?: RecommendationSignals;
}) {
  const recommendationCatalog = expandSparseCatalog(movies);
  const context = {
    favoriteIds,
    progressItems,
    genrePreferenceScores: signals.genrePreferenceScores,
    contentScoreMap: signals.contentScoreMap,
  };

  return {
    rows: buildPersonalizedRows(recommendationCatalog, context),
    trending: buildTrending(recommendationCatalog, signals.contentScoreMap),
    similarity: buildSimilaritySignals(recommendationCatalog, context, signals.similarity),
    profile: buildCinematicProfile({ favoriteIds, progressItems }),
  };
}

type RecommendationSignals = {
  genrePreferenceScores: Map<string, number>;
  contentScoreMap: Map<string, number>;
  similarity: { averageScore: number; count: number };
};

function createEmptySignals(): RecommendationSignals {
  return {
    genrePreferenceScores: new Map(),
    contentScoreMap: new Map(),
    similarity: { averageScore: 0, count: 0 },
  };
}

export async function getLiveRecommendationSignals(movies: Movie[]): Promise<RecommendationSignals> {
  if (!hasSupabaseEnv()) return createEmptySignals();

  const userId = await getCurrentUserId();
  const activeProfile = await getActiveViewerProfile();
  const supabase = await createSupabaseServerClient();
  const movieIds = movies.map((movie) => movie.id);
  const genreById = new Map(movies.flatMap((movie) => movie.genres.map((genre) => [genre.id, genre.slug] as const)));

  const [preferencesResponse, scoresResponse, similarityResponse] = await Promise.all([
    userId && activeProfile
      ? supabase.from("user_preferences").select("genre_id, score").eq("user_id", userId).eq("profile_id", activeProfile.id)
      : Promise.resolve({ data: null, error: null }),
    movieIds.length
      ? supabase.from("content_scores").select("movie_id, recommendation_score").in("movie_id", movieIds)
      : Promise.resolve({ data: null, error: null }),
    userId
      ? supabase.from("user_similarity").select("similarity_score").eq("user_id", userId).order("similarity_score", { ascending: false }).limit(20)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const signals = createEmptySignals();

  if (!preferencesResponse.error && preferencesResponse.data) {
    for (const item of preferencesResponse.data) {
      const slug = genreById.get(item.genre_id as string);
      if (slug) {
        signals.genrePreferenceScores.set(slug, (signals.genrePreferenceScores.get(slug) ?? 0) + Number(item.score ?? 0));
      }
    }
  }

  if (!scoresResponse.error && scoresResponse.data) {
    for (const item of scoresResponse.data) {
      signals.contentScoreMap.set(item.movie_id as string, Number(item.recommendation_score ?? 0));
    }
  }

  if (!similarityResponse.error && similarityResponse.data?.length) {
    const scores = similarityResponse.data.map((item) => Number(item.similarity_score ?? 0));
    signals.similarity = {
      averageScore: scores.reduce((total, score) => total + score, 0) / scores.length,
      count: scores.length,
    };
  }

  return signals;
}

function expandSparseCatalog(movies: Movie[]) {
  if (movies.length >= 6) return movies;

  const seen = new Set(movies.map((movie) => movie.slug));
  const expansion = mockMovies.filter((movie) => !seen.has(movie.slug));
  return [...movies, ...expansion];
}

export function buildCinematicProfile({
  favoriteIds,
  progressItems,
}: {
  favoriteIds: string[];
  progressItems: Awaited<ReturnType<typeof getWatchProgressItems>>;
}) {
  const genreMinutes = new Map<string, { name: string; minutes: number }>();
  let totalMinutes = 0;
  let favoriteSeries = "";
  let favoriteMovie = "";

  for (const { movie, item } of progressItems) {
    const minutes = Math.floor(item.progressSeconds / 60);
    totalMinutes += minutes;
    if (movie.type === "series" && !favoriteSeries) favoriteSeries = movie.title;
    if (movie.type === "movie" && !favoriteMovie) favoriteMovie = movie.title;

    for (const genre of movie.genres) {
      const current = genreMinutes.get(genre.slug) ?? { name: genre.name, minutes: 0 };
      genreMinutes.set(genre.slug, { name: genre.name, minutes: current.minutes + minutes });
    }
  }

  const favoriteGenre = Array.from(genreMinutes.values()).sort((a, b) => b.minutes - a.minutes)[0]?.name ?? "Cinema";
  const archetype = progressItems.some(({ movie }) => movie.type === "series")
    ? "Maratonista de Series"
    : favoriteIds.length >= 3
      ? "Colecionador de Favoritos"
      : favoriteGenre === "Sci-fi"
        ? "Cinefilo Sci-Fi"
        : "Explorador de Conteudo";

  return {
    favoriteGenre,
    watchedHours: Math.round(totalMinutes / 60),
    favoriteSeries: favoriteSeries || "Em descoberta",
    favoriteMovie: favoriteMovie || "Em descoberta",
    archetype,
    favoriteCount: favoriteIds.length,
  };
}

export async function getRecommendationAdminInsights() {
  const [intelligence, movies] = await Promise.all([getMaxCinemaIntelligence(), getCatalogMovies()]);
  const signals = await getLiveRecommendationSignals(movies);
  const recommended = intelligence.rows.flatMap((row) => row.items);
  const unique = new Map(recommended.map((item) => [item.movie.id, item]));
  const topRecommended = Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    totalRows: intelligence.rows.length,
    avgMatch: topRecommended.length
      ? Math.round(topRecommended.reduce((total, item) => total + item.match, 0) / topRecommended.length)
      : 0,
    topRecommended,
    similarity: intelligence.similarity,
    trending: intelligence.trending.slice(0, 5),
    liveScoredContent: signals.contentScoreMap.size,
  };
}
