import type { Movie, WatchProgress } from "@/types/domain";

export type RecommendationContext = {
  favoriteIds: string[];
  progressItems: { item: WatchProgress; movie: Movie }[];
  genrePreferenceScores?: Map<string, number>;
  contentScoreMap?: Map<string, number>;
  now?: Date;
};

export type RecommendationReason =
  | "genre_match"
  | "favorite_signal"
  | "continue_signal"
  | "high_rating"
  | "fresh_release"
  | "short_runtime"
  | "series_affinity"
  | "discovery"
  | "trending";

export type ScoredMovie = {
  movie: Movie;
  score: number;
  match: number;
  reasons: RecommendationReason[];
  label: string;
};

function genrePreferenceMap(context: RecommendationContext) {
  const map = new Map<string, number>();

  for (const { movie, item } of context.progressItems) {
    const completion = item.durationSeconds ? item.progressSeconds / item.durationSeconds : 0;
    const weight = completion > 0.85 ? 10 : completion > 0.35 ? 6 : 2;
    for (const genre of movie.genres) {
      map.set(genre.slug, (map.get(genre.slug) ?? 0) + weight);
    }
  }

  for (const [genreSlug, score] of context.genrePreferenceScores ?? []) {
    map.set(genreSlug, (map.get(genreSlug) ?? 0) + score);
  }

  return map;
}

export function scoreMovie(movie: Movie, context: RecommendationContext): ScoredMovie {
  const reasons = new Set<RecommendationReason>();
  const favoriteSet = new Set(context.favoriteIds);
  const watchedSet = new Set(context.progressItems.map(({ movie: watched }) => watched.id));
  const genreMap = genrePreferenceMap(context);
  const hour = (context.now ?? new Date()).getHours();
  let score = 0;

  for (const genre of movie.genres) {
    const preference = genreMap.get(genre.slug) ?? 0;
    if (preference) {
      score += Math.min(44, preference * 2.4);
      reasons.add("genre_match");
    }
  }

  const contentScore = context.contentScoreMap?.get(movie.id) ?? 0;
  if (contentScore > 0) {
    score += Math.min(24, contentScore / 4);
    reasons.add("trending");
  }

  if (favoriteSet.has(movie.id)) {
    score += 30;
    reasons.add("favorite_signal");
  }

  if (watchedSet.has(movie.id)) {
    score -= 35;
    reasons.add("continue_signal");
  }

  if (movie.rating >= 8.8) {
    score += 14;
    reasons.add("high_rating");
  }

  if (movie.releaseYear >= new Date().getFullYear() - 1) {
    score += 12;
    reasons.add("fresh_release");
  }

  if (movie.durationMinutes <= 95) {
    score += 9;
    reasons.add("short_runtime");
  }

  if (movie.type === "series" && context.progressItems.some(({ movie: watched }) => watched.type === "series")) {
    score += 16;
    reasons.add("series_affinity");
  }

  if (hour >= 19 || hour <= 1) {
    score += movie.rating >= 8.5 ? 8 : 0;
    reasons.add("trending");
  }

  if (!reasons.has("genre_match") && !favoriteSet.has(movie.id)) {
    score += 7;
    reasons.add("discovery");
  }

  const normalized = Math.max(38, Math.min(97, Math.round(62 + score / 2.1)));

  return {
    movie,
    score,
    match: normalized,
    reasons: Array.from(reasons),
    label: buildReasonLabel(Array.from(reasons), normalized),
  };
}

export function buildReasonLabel(reasons: RecommendationReason[], match: number) {
  if (reasons.includes("favorite_signal")) return `Combina ${match}% com seus favoritos`;
  if (reasons.includes("genre_match")) return `Combina ${match}% com seu perfil`;
  if (reasons.includes("series_affinity")) return "Maratone agora";
  if (reasons.includes("short_runtime")) return "Filme curto para voce";
  if (reasons.includes("fresh_release")) return "Lancamento com alta afinidade";
  if (reasons.includes("trending")) return "Tendencia para seu perfil";
  return "Descoberta fora da bolha";
}
