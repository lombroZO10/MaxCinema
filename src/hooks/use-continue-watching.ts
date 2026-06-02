"use client";

import { useMemo } from "react";
import type { Movie, WatchProgress } from "@/types/domain";

export function useContinueWatching(items: { item: WatchProgress; movie: Movie }[]) {
  return useMemo(() => items.filter(({ item }) => item.progressSeconds > 0), [items]);
}
