"use client";

import { useMemo } from "react";
import type { Movie, WatchProgress } from "@/types/domain";
import { buildPersonalizedRows } from "@/services/recommendation/recommendation-builder";

export function useRecommendations({
  movies,
  favoriteIds,
  progressItems,
}: {
  movies: Movie[];
  favoriteIds: string[];
  progressItems: { item: WatchProgress; movie: Movie }[];
}) {
  return useMemo(() => buildPersonalizedRows(movies, { favoriteIds, progressItems }), [movies, favoriteIds, progressItems]);
}
