"use client";

import { useMemo } from "react";
import type { Movie } from "@/types/domain";
import { buildTrending } from "@/services/recommendation/recommendation-trending";

export function useTrending(movies: Movie[]) {
  return useMemo(() => buildTrending(movies), [movies]);
}
