"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Play, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { useRecommendationEvent, useRecommendationImpression } from "@/hooks/use-recommendation-event";
import type { Movie } from "@/types/domain";
import { formatDuration } from "@/utils/format";

function heroItems(movies: Movie[], fallback: Movie) {
  const ranked = [...movies]
    .filter((movie) => movie.backdropUrl || movie.posterUrl)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating || b.releaseYear - a.releaseYear);

  const unique = new Map<string, Movie>();
  for (const movie of [fallback, ...ranked]) {
    unique.set(movie.id, movie);
  }

  return Array.from(unique.values()).slice(0, 5);
}

function editorialBadge(movie: Movie, index: number) {
  if (movie.genres.some((genre) => genre.slug === "original")) return "Original MaxCinema";
  if (movie.releaseYear >= new Date().getFullYear() - 1) return "Lancamento";
  if (movie.featured || index === 0) return "Escolha da curadoria";
  if (movie.rating >= 8.7) return "Mais assistido";
  return "Em destaque";
}

function starRating(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating / 2)));
  return "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(0, 5 - filled);
}

export function HeroFeature({
  movie,
  movies = [movie],
  favoriteIds = [],
  backdropFallbackUrl,
  heroRotating = true,
  heroRotationMs = 8500,
  showTrailerButton = true,
  showFavoriteButton = true,
}: {
  movie: Movie;
  movies?: Movie[];
  favoriteIds?: string[];
  backdropFallbackUrl?: string;
  heroRotating?: boolean;
  heroRotationMs?: number;
  showTrailerButton?: boolean;
  showFavoriteButton?: boolean;
}) {
  const items = useMemo(() => heroItems(movies, movie), [movie, movies]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMovie = items[activeIndex] ?? movie;
  const activeBadge = editorialBadge(activeMovie, activeIndex);
  const isOriginal = activeMovie.genres.some((genre) => genre.slug === "original");

  const eventPayload = {
    movieId: activeMovie.id,
    sectionSlug: "featured_cinema_experience",
    score: activeMovie.rating * 10,
    reason: "featured",
    metadata: {
      title: activeMovie.title,
      featured: activeMovie.featured,
      slideIndex: activeIndex,
    },
  };
  const recordEvent = useRecommendationEvent(eventPayload);
  useRecommendationImpression(eventPayload);

  useEffect(() => {
    if (!heroRotating || items.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, heroRotationMs);

    return () => window.clearInterval(timer);
  }, [heroRotating, heroRotationMs, items.length]);

  return (
    <section className="relative min-h-[720px] overflow-hidden md:min-h-[780px] xl:min-h-[820px] 2xl:min-h-[880px]">
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0"
          exit={{ opacity: 0, scale: 1.018 }}
          initial={{ opacity: 0, scale: 1.035 }}
          key={activeMovie.id}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            alt=""
            animate={{ scale: 1.045, x: 10 }}
            className="h-full w-full object-cover"
            initial={{ scale: 1.015, x: 0 }}
            src={activeMovie.backdropUrl || activeMovie.posterUrl || backdropFallbackUrl}
            transition={{ duration: 10, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_22%,rgba(3,6,9,.54)_48%,rgba(3,6,9,.14)_72%,rgba(3,6,9,.58)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.08)_0%,rgba(3,6,9,.08)_44%,#030609_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_35%,transparent_0%,rgba(0,0,0,.22)_58%,rgba(0,0,0,.62)_100%)]" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[1920px] items-center gap-8 px-5 pb-28 pt-28 md:min-h-[780px] md:px-10 md:pb-32 xl:min-h-[820px] xl:grid-cols-[minmax(0,1fr)_340px] xl:px-20 xl:pb-28 xl:pt-32 2xl:min-h-[880px] 2xl:px-24">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
            exit={{ opacity: 0, y: 14 }}
            initial={{ opacity: 0, y: 18 }}
            key={`${activeMovie.id}-copy`}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex flex-wrap items-center gap-3 xl:mb-4">
              <span className="rounded-full border border-white/14 bg-white/[0.075] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/82 backdrop-blur">
                {activeBadge}
              </span>
              {isOriginal ? <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cinema-cyan">Original MaxCinema</span> : null}
            </div>

            <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-white/58 xl:text-[15px]">
              Em destaque no MaxCinema
            </p>
            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.9] tracking-[-0.04em] text-white md:text-8xl xl:text-[8.5rem] 2xl:text-[10rem]">
              {activeMovie.title}
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-base font-semibold text-white/82 xl:mt-7 xl:text-[17px]">
              <span className="inline-flex items-center gap-2 text-cinema-amber">
                <Star size={17} fill="currentColor" />
                {activeMovie.rating.toFixed(1)}
              </span>
              <span className="text-white/36">{starRating(activeMovie.rating)}</span>
              <span>{formatDuration(activeMovie.durationMinutes)}</span>
              <span>{activeMovie.releaseYear}</span>
              <span>{activeMovie.maturityRating}</span>
              <span>{activeMovie.genres.slice(0, 2).map((genre) => genre.name).join(" / ")}</span>
            </div>

            <p className="mt-7 max-w-3xl text-lg leading-9 text-white/72 md:text-xl xl:mt-7 xl:text-[1.28rem] xl:leading-9 2xl:max-w-4xl 2xl:text-[1.38rem] 2xl:leading-10">
              {activeMovie.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-3 xl:mt-9">
              <Button className="h-14 px-7 text-base" href={`/watch/${activeMovie.id}`} icon={<Play size={20} fill="currentColor" />} onClick={() => recordEvent("play", { target: "hero_watch" })}>
                Assistir agora
              </Button>
              <Button className="h-14 px-6 text-base" href={`/movie/${activeMovie.slug}`} icon={<Info size={19} />} onClick={() => recordEvent("clicked", { target: "hero_details" })} variant="secondary">
                Mais detalhes
              </Button>
              {showFavoriteButton ? (
                <FavoriteButton
                  className="h-14 rounded-md border-white/16 bg-white/6 px-6 text-base text-white/78 hover:bg-white/10"
                  initialFavorite={favoriteIds.includes(activeMovie.id)}
                  label
                  movieId={activeMovie.id}
                />
              ) : null}
              {showTrailerButton && activeMovie.trailerUrl ? (
                <Button className="h-14 px-6 text-base" href={`/watch/${activeMovie.id}`} icon={<Play size={19} />} onClick={() => recordEvent("play", { target: "hero_trailer" })} variant="ghost">
                  Trailer
                </Button>
              ) : (
                <Button className="h-14 px-6 text-base" href={`/favorites`} icon={<Plus size={19} />} variant="ghost">
                  Minha lista
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {items.length > 1 ? (
        <div className="hidden self-end pb-20 xl:block">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Proximos destaques</p>
            <span className="text-xs text-white/38">{activeIndex + 1}/{items.length}</span>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => {
              const active = index === activeIndex;
              return (
                <button
                  className={`group grid w-full grid-cols-[48px_1fr] items-center gap-3 rounded-lg p-2 text-left transition ${
                    active ? "bg-white/[0.085]" : "bg-white/[0.035] hover:bg-white/[0.06]"
                  }`}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <img alt="" className="aspect-[2/3] w-full rounded-md object-cover" src={item.posterUrl || item.backdropUrl} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{item.title}</span>
                    <span className="mt-1 block text-xs text-white/48">{formatDuration(item.durationMinutes)} · {item.releaseYear}</span>
                    <span className={`mt-3 block h-0.5 rounded-full ${active ? "bg-white/80" : "bg-white/14 group-hover:bg-white/28"}`} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        ) : null}
      </div>

      {items.length > 1 ? (
      <div className="absolute bottom-12 left-5 right-5 z-20 flex gap-2 md:left-10 md:right-auto xl:left-20 2xl:left-24">
        {items.map((item, index) => (
          <button
            aria-label={`Ir para destaque ${item.title}`}
            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-12 bg-white/78" : "w-7 bg-white/22 hover:bg-white/42"}`}
            key={`indicator-${item.id}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
      ) : null}
    </section>
  );
}
