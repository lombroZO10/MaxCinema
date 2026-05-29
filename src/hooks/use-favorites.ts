"use client";

import { useState } from "react";

const key = "maxcinema:favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as string[] : [];
  });

  function toggleFavorite(movieId: string) {
    setFavorites((current) => {
      const next = current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId];
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  return { favorites, toggleFavorite };
}
