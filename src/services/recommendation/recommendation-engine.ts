import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { getCurrentUserId, getFavoriteMovieIds, getWatchProgressItems } from "@/services/user-library-service";
import { buildPersonalizedRows, type PersonalizedRow } from "@/services/recommendation/recommendation-builder";
import { recordRecommendationEvent } from "@/services/recommendation/recommendation-events";
import { buildSimilaritySignals } from "@/services/recommendation/recommendation-similarity";
import { buildTrending } from "@/services/recommendation/recommendation-trending";
import { RECOMMENDATION_SECTION_OPTIONS, type RecommendationSectionType } from "@/services/recommendation/recommendation-types";
import { scoreMovie, type RecommendationContext, type ScoredMovie } from "@/services/recommendation/recommendation-score";
import type { Movie, WatchProgress } from "@/types/domain";

type HomeRecommendationSection = {
  id: string;
  title: string;
  slug: string;
  position: number | null;
  display_limit: number | null;
  source_key: string | null;
};

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
  const recommendationCatalog = movies.filter((movie) => movie.status === "published");
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

function createContext({
  favoriteIds,
  progressItems,
  signals,
}: {
  favoriteIds: string[];
  progressItems: { item: WatchProgress; movie: Movie }[];
  signals: RecommendationSignals;
}): RecommendationContext {
  return {
    favoriteIds,
    progressItems,
    genrePreferenceScores: signals.genrePreferenceScores,
    contentScoreMap: signals.contentScoreMap,
  };
}

function uniqueScored(items: ScoredMovie[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.movie.id)) return false;
    seen.add(item.movie.id);
    return true;
  });
}

function topGenreSlugs(context: RecommendationContext) {
  const scores = new Map<string, number>();
  for (const { movie, item } of context.progressItems) {
    const completion = item.durationSeconds ? item.progressSeconds / item.durationSeconds : 0;
    const weight = completion >= 0.85 ? 12 : completion >= 0.35 ? 7 : 3;
    for (const genre of movie.genres) scores.set(genre.slug, (scores.get(genre.slug) ?? 0) + weight);
  }
  for (const [slug, score] of context.genrePreferenceScores ?? []) scores.set(slug, (scores.get(slug) ?? 0) + score);
  return Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).map(([slug]) => slug);
}

function scoreCatalog(movies: Movie[], context: RecommendationContext) {
  const completedIds = new Set(
    context.progressItems
      .filter(({ item }) => item.durationSeconds > 0 && item.progressSeconds / item.durationSeconds >= 0.85)
      .map(({ movie }) => movie.id),
  );
  return movies
    .filter((movie) => movie.status === "published")
    .filter((movie) => !completedIds.has(movie.id))
    .map((movie) => scoreMovie(movie, context))
    .sort((a, b) => b.score - a.score || b.movie.rating - a.movie.rating);
}

function buildRow(id: string, title: string, description: string, intent: PersonalizedRow["intent"], items: ScoredMovie[], limit = 8): PersonalizedRow {
  return { id, title, description, intent, items: uniqueScored(items).slice(0, limit) };
}

export function getRecommendationScore(movie: Movie, context: RecommendationContext) {
  return scoreMovie(movie, context);
}

export async function getRecommendedForYou(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context);
  return buildRow("recommended-for-you", "Recomendados para voce", "Favoritos, progresso, qualidade e diversidade em uma selecao unica.", "personal", scored, limit);
}

export async function getTrendingForProfile(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context).sort((a, b) => {
    const aLive = context.signals.contentScoreMap.get(a.movie.id) ?? 0;
    const bLive = context.signals.contentScoreMap.get(b.movie.id) ?? 0;
    return bLive - aLive || b.score - a.score || b.movie.releaseYear - a.movie.releaseYear;
  });
  return buildRow("trending-for-profile", "Tendencias para seu perfil", "Popularidade real combinada com afinidade do perfil ativo.", "trend", scored, limit);
}

export async function getBecauseYouWatched(limit = 8) {
  const context = await getRecommendationContext();
  const watched = context.progressItems[0]?.movie;
  const watchedGenres = new Set(watched?.genres.map((genre) => genre.slug) ?? []);
  const scored = scoreCatalog(context.movies, context.context)
    .filter((item) => item.movie.id !== watched?.id)
    .filter((item) => item.movie.genres.some((genre) => watchedGenres.has(genre.slug)) || item.movie.type === watched?.type)
    .sort((a, b) => b.score - a.score || b.movie.rating - a.movie.rating);
  const title = watched ? `Porque voce assistiu ${watched.title}` : "Porque voce assistiu";
  return buildRow("because-you-watched", title, "Relacionados por genero, tipo, popularidade e qualidade editorial.", "behavior", scored, limit);
}

export async function getTonightPicks(limit = 8) {
  const context = await getRecommendationContext();
  const hour = new Date().getHours();
  const maxDuration = hour >= 21 || hour <= 1 ? 130 : 115;
  const scored = scoreCatalog(context.movies, context.context)
    .filter((item) => item.movie.type === "movie")
    .filter((item) => item.movie.durationMinutes <= maxDuration)
    .sort((a, b) => b.movie.rating - a.movie.rating || b.score - a.score);
  return buildRow("tonight-picks", "Filmes para hoje a noite", "Duracao confortavel, nota alta e afinidade para assistir agora.", "trend", scored, limit);
}

export async function getBingeNow(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context)
    .filter((item) => item.movie.type === "series" || item.movie.durationMinutes >= 120)
    .sort((a, b) => b.score - a.score || b.movie.rating - a.movie.rating);
  return buildRow("binge-now", "Maratone agora", "Series, universos longos e conteudos com maior afinidade de historico.", "behavior", scored, limit);
}

export async function getDiscoverSomethingDifferent(limit = 8) {
  const context = await getRecommendationContext();
  const preferred = new Set(topGenreSlugs(context.context).slice(0, 3));
  const scored = scoreCatalog(context.movies, context.context)
    .filter((item) => !item.movie.genres.some((genre) => preferred.has(genre.slug)))
    .sort((a, b) => b.movie.rating - a.movie.rating || b.score - a.score);
  return buildRow("discover-different", "Descubra algo diferente", "Diversidade fora do padrao sem abrir mao de qualidade.", "discovery", scored, limit);
}

export async function getBasedOnFavorites(limit = 8) {
  const context = await getRecommendationContext();
  const favoriteMovies = context.movies.filter((movie) => context.favoriteIds.includes(movie.id));
  const favoriteGenres = new Set(favoriteMovies.flatMap((movie) => movie.genres.map((genre) => genre.slug)));
  const scored = scoreCatalog(context.movies, context.context)
    .filter((item) => !context.favoriteIds.includes(item.movie.id))
    .filter((item) => item.movie.genres.some((genre) => favoriteGenres.has(genre.slug)));
  return buildRow("based-on-favorites", "Baseado nos seus favoritos", "Afinidade direta com generos e sinais dos seus favoritos.", "personal", scored, limit);
}

export async function getHighRatedContent(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context).sort((a, b) => b.movie.rating - a.movie.rating || b.score - a.score);
  return buildRow("high-rated", "Alta avaliacao", "Conteudos publicados com melhor avaliacao e bom encaixe editorial.", "trend", scored, limit);
}

export async function getNewReleasesForYou(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context).sort((a, b) => b.movie.releaseYear - a.movie.releaseYear || b.score - a.score);
  return buildRow("new-releases", "Lancamentos para voce", "Novidades com maior afinidade para o perfil ativo.", "personal", scored, limit);
}

export async function getPopularOnMaxCinema(limit = 8) {
  const context = await getRecommendationContext();
  const scored = scoreCatalog(context.movies, context.context).sort((a, b) => {
    const aLive = context.signals.contentScoreMap.get(a.movie.id) ?? 0;
    const bLive = context.signals.contentScoreMap.get(b.movie.id) ?? 0;
    return bLive - aLive || b.movie.rating - a.movie.rating || b.score - a.score;
  });
  return buildRow("popular", "Populares no MaxCinema", "Favoritos, plays, cliques e qualidade agregados em tempo real.", "trend", scored, limit);
}

export async function getContinueWatching(limit = 8) {
  const context = await getRecommendationContext();
  const items = context.progressItems
    .filter(({ item }) => item.durationSeconds > 0 && item.progressSeconds / item.durationSeconds < 0.85)
    .map(({ movie }) => scoreMovie(movie, context.context));
  return buildRow("continue-watching", "Continuar assistindo", "Progresso real do perfil ativo.", "continue", items, limit);
}

async function getRecommendationContext() {
  const [movies, favoriteIds, progressItems] = await Promise.all([
    getCatalogMovies(),
    getFavoriteMovieIds(),
    getWatchProgressItems(),
  ]);
  const published = movies.filter((movie) => movie.status === "published");
  const signals = await getLiveRecommendationSignals(published);
  return {
    movies: published,
    favoriteIds,
    progressItems,
    signals,
    context: createContext({ favoriteIds, progressItems, signals }),
  };
}

async function buildSectionByType(type: RecommendationSectionType, limit: number) {
  switch (type) {
    case "trending_for_profile":
      return getTrendingForProfile(limit);
    case "binge_now":
      return getBingeNow(limit);
    case "discover_different":
      return getDiscoverSomethingDifferent(limit);
    case "tonight_picks":
      return getTonightPicks(limit);
    case "based_on_favorites":
      return getBasedOnFavorites(limit);
    case "because_you_watched":
      return getBecauseYouWatched(limit);
    case "continue_watching":
      return getContinueWatching(limit);
    case "high_rated":
      return getHighRatedContent(limit);
    case "new_releases":
      return getNewReleasesForYou(limit);
    case "popular":
      return getPopularOnMaxCinema(limit);
    case "recommended_for_you":
    default:
      return getRecommendedForYou(limit);
  }
}

function normalizeRecommendationType(value?: string | null): RecommendationSectionType {
  return RECOMMENDATION_SECTION_OPTIONS.some((option) => option.value === value)
    ? (value as RecommendationSectionType)
    : "recommended_for_you";
}

function dedupeRows(rows: PersonalizedRow[]) {
  const usedEarly = new Set<string>();
  return rows
    .map((row, rowIndex) => {
      if (rowIndex >= 3 || row.id.includes("top-10") || row.id === "popular") return row;
      const items = row.items.filter((item) => {
        if (usedEarly.has(item.movie.id)) return false;
        usedEarly.add(item.movie.id);
        return true;
      });
      return { ...row, items };
    })
    .filter((row) => row.items.length);
}

async function getConfiguredRecommendationSections() {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("home_sections")
      .select("id, title, slug, position, display_limit, source_key")
      .eq("active", true)
      .eq("source_type", "recommendation")
      .order("position", { ascending: true });

    if (error || !data?.length) return [];
    return data as HomeRecommendationSection[];
  } catch {
    return [];
  }
}

export async function getPersonalizedSections() {
  const configured = await getConfiguredRecommendationSections();
  if (configured.length) {
    const rows = await Promise.all(
      configured.map(async (section) => {
        const row = await buildSectionByType(normalizeRecommendationType(section.source_key), section.display_limit ?? 8);
        return {
          ...row,
          id: section.slug,
          title: section.title || row.title,
        };
      }),
    );
    return dedupeRows(rows);
  }

  const [recommended, tonight, binge, discovery, based, because, highRated, releases, popular] = await Promise.all([
    getRecommendedForYou(),
    getTonightPicks(),
    getBingeNow(),
    getDiscoverSomethingDifferent(),
    getBasedOnFavorites(),
    getBecauseYouWatched(),
    getHighRatedContent(),
    getNewReleasesForYou(),
    getPopularOnMaxCinema(),
  ]);

  return dedupeRows([recommended, tonight, binge, discovery, based, because, highRated, releases, popular]);
}

export async function logRecommendationView(movieId: string, sectionSlug: string, score = 0, metadata: Record<string, string | number | boolean | null> = {}) {
  return recordRecommendationEvent({ movieId, event: "view", sectionSlug, score, metadata });
}

export async function logRecommendationClick(movieId: string, sectionSlug: string, score = 0, metadata: Record<string, string | number | boolean | null> = {}) {
  return recordRecommendationEvent({ movieId, event: "click", sectionSlug, score, metadata });
}

export async function getRecommendationAdminInsights() {
  const [intelligence, movies] = await Promise.all([getMaxCinemaIntelligence(), getCatalogMovies()]);
  const signals = await getLiveRecommendationSignals(movies);
  const recommended = intelligence.rows.flatMap((row) => row.items);
  const unique = new Map(recommended.map((item) => [item.movie.id, item]));
  const topRecommended = Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 5);
  const analytics = await getRecommendationLogAnalytics(movies);

  return {
    totalRows: intelligence.rows.length,
    avgMatch: topRecommended.length
      ? Math.round(topRecommended.reduce((total, item) => total + item.match, 0) / topRecommended.length)
      : 0,
    topRecommended,
    similarity: intelligence.similarity,
    trending: intelligence.trending.slice(0, 5),
    liveScoredContent: signals.contentScoreMap.size,
    ...analytics,
  };
}

async function getRecommendationLogAnalytics(movies: Movie[]) {
  const empty = {
    views: 0,
    clicks: 0,
    ctr: 0,
    topClicked: [] as { movie: Movie; clicks: number }[],
    sectionPerformance: [] as { sectionSlug: string; views: number; clicks: number; ctr: number }[],
    activeIntelligenceSections: 0,
    lastUpdatedAt: null as string | null,
  };

  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: logs, error: logsError }, { data: sections, error: sectionsError }] = await Promise.all([
      supabase
        .from("recommendation_logs")
        .select("movie_id, section_slug, event, event_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("home_sections")
        .select("id")
        .eq("active", true)
        .eq("source_type", "recommendation"),
    ]);

    if (logsError) return empty;

    const movieById = new Map(movies.map((movie) => [movie.id, movie]));
    const sectionMap = new Map<string, { sectionSlug: string; views: number; clicks: number; ctr: number }>();
    const clickMap = new Map<string, number>();
    let views = 0;
    let clicks = 0;

    for (const log of logs ?? []) {
      const metadata = (log.metadata && typeof log.metadata === "object" ? log.metadata : {}) as { eventType?: string };
      const event = String((metadata.eventType ?? log.event_type ?? log.event ?? "") as string);
      const sectionSlug = String((log.section_slug ?? "unknown") as string);
      const section = sectionMap.get(sectionSlug) ?? { sectionSlug, views: 0, clicks: 0, ctr: 0 };
      if (event === "view" || event === "shown") {
        views += 1;
        section.views += 1;
      }
      if (event === "click" || event === "clicked" || event === "play") {
        clicks += 1;
        section.clicks += 1;
        const movieId = String((log.movie_id ?? "") as string);
        if (movieId) clickMap.set(movieId, (clickMap.get(movieId) ?? 0) + 1);
      }
      section.ctr = section.views ? Math.round((section.clicks / section.views) * 100) : 0;
      sectionMap.set(sectionSlug, section);
    }

    return {
      views,
      clicks,
      ctr: views ? Math.round((clicks / views) * 100) : 0,
      topClicked: Array.from(clickMap.entries())
        .map(([movieId, count]) => ({ movie: movieById.get(movieId), clicks: count }))
        .filter((entry): entry is { movie: Movie; clicks: number } => Boolean(entry.movie))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5),
      sectionPerformance: Array.from(sectionMap.values()).sort((a, b) => b.ctr - a.ctr || b.clicks - a.clicks).slice(0, 5),
      activeIntelligenceSections: sectionsError ? 0 : sections?.length ?? 0,
      lastUpdatedAt: logs?.[0]?.created_at ? String(logs[0].created_at) : null,
    };
  } catch {
    return empty;
  }
}
