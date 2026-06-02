"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/utils/cn";

export function FavoriteButton({
  movieId,
  initialFavorite = false,
  label = false,
  className,
}: {
  movieId: string;
  initialFavorite?: boolean;
  label?: boolean;
  className?: string;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, favorite: next }),
      });

      if (!response.ok) {
        setFavorite(!next);
      }
    });
  }

  return (
    <button
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/16 bg-white/6 px-4 text-sm font-semibold text-white/78 transition hover:border-cinema-cyan/40 hover:text-white disabled:opacity-55",
        favorite && "border-cinema-cyan/40 bg-cinema-cyan/12 text-cinema-cyan",
        className,
      )}
      disabled={pending}
      onClick={toggleFavorite}
      type="button"
    >
      <Heart size={17} fill={favorite ? "currentColor" : "none"} />
      {label ? (favorite ? "Favoritado" : "Favorito") : null}
    </button>
  );
}
