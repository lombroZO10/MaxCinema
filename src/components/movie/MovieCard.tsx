"use client";

import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { useRecommendationEvent, useRecommendationImpression } from "@/hooks/use-recommendation-event";
import type { Movie } from "@/types/domain";
import { formatDuration } from "@/utils/format";

export function MovieCard({
  movie,
  priority = false,
  favorite = false,
  posterFallbackUrl,
  showRating = true,
  showDuration = true,
  showGenres = true,
  showFavoriteButton = true,
}: {
  movie: Movie;
  priority?: boolean;
  favorite?: boolean;
  posterFallbackUrl?: string;
  showRating?: boolean;
  showDuration?: boolean;
  showGenres?: boolean;
  showFavoriteButton?: boolean;
}) {
  const eventPayload = {
    movieId: movie.id,
    sectionSlug: "catalog_rail",
    score: movie.rating * 10,
    reason: "catalog",
    metadata: {
      title: movie.title,
      type: movie.type,
    },
  };
  const recordEvent = useRecommendationEvent(eventPayload);
  useRecommendationImpression(eventPayload);

  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      whileHover={{ y: -9, scale: 1.025 }}
      className="group relative w-[168px] min-w-[168px] overflow-hidden rounded-lg border border-white/10 bg-white/6 shadow-[0_18px_60px_rgba(0,0,0,0.36)] transition duration-500 md:w-[208px] md:min-w-[208px] lg:w-[190px] lg:min-w-[190px] xl:w-[202px] xl:min-w-[202px] 2xl:w-[224px] 2xl:min-w-[224px]"
    >
      <Link aria-label={`Abrir ${movie.title}`} href={`/movie/${movie.slug}`} onClick={() => recordEvent("clicked", { target: "details" })}>
        <div className="poster-shine relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            loading={priority ? "eager" : "lazy"}
            src={movie.posterUrl || posterFallbackUrl}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_34%,rgba(0,0,0,.18)_55%,rgba(0,0,0,.84)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-3.5 lg:p-4">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-white/86 lg:text-[13px]">
              {showRating ? (
                <span className="inline-flex items-center gap-1 text-cinema-amber">
                  <Star size={14} fill="currentColor" />
                  {movie.rating}
                </span>
              ) : null}
              <span>{movie.releaseYear}</span>
              {showDuration ? <span>{formatDuration(movie.durationMinutes)}</span> : null}
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white lg:text-[15px] 2xl:text-base">{movie.title}</h3>
            {showGenres ? (
              <p className="mt-1.5 line-clamp-1 text-xs font-medium text-white/58 lg:text-[13px]">
                {movie.genres.map((genre) => genre.name).join(" / ")}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 ring-1 ring-white/28 shadow-[0_28px_90px_rgba(0,0,0,0.5)] transition group-hover:opacity-100" />
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition duration-300 group-hover:opacity-100">
        <Link
          aria-label={`Assistir ${movie.title}`}
          className="grid size-9 place-items-center rounded-full bg-cinema-cyan text-slate-950 shadow-lg lg:size-10"
          href={`/watch/${movie.id}`}
          onClick={() => recordEvent("play", { target: "watch" })}
        >
          <Play size={17} fill="currentColor" />
        </Link>
        {showFavoriteButton ? (
          <FavoriteButton
            className="grid size-9 place-items-center rounded-full border-white/20 bg-black/48 p-0 backdrop-blur lg:size-10"
            initialFavorite={favorite}
            movieId={movie.id}
          />
        ) : null}
      </div>
    </motion.article>
  );
}
