"use client";

import { Play, Star } from "lucide-react";
import Link from "next/link";
import type { ScoredMovie } from "@/services/recommendation/recommendation-score";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { useRecommendationEvent, useRecommendationImpression } from "@/hooks/use-recommendation-event";
import { formatDuration } from "@/utils/format";

export function RecommendationCard({
  item,
  favorite = false,
  sectionSlug = "personalized",
}: {
  item: ScoredMovie;
  favorite?: boolean;
  sectionSlug?: string;
}) {
  const { movie } = item;
  const eventPayload = {
    movieId: movie.id,
    sectionSlug,
    score: item.score,
    reason: item.reasons[0],
    metadata: {
      match: item.match,
      label: item.label,
    },
  };
  const recordEvent = useRecommendationEvent(eventPayload);
  useRecommendationImpression(eventPayload);

  return (
    <article className="group relative w-[210px] min-w-[210px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,.36)] transition duration-500 hover:-translate-y-2 hover:border-white/24 hover:shadow-[0_30px_95px_rgba(0,0,0,.48)] lg:w-[190px] lg:min-w-[190px] xl:w-[202px] xl:min-w-[202px] 2xl:w-[224px] 2xl:min-w-[224px]">
      <Link aria-label={`Abrir ${movie.title}`} href={`/movie/${movie.slug}`} onClick={() => recordEvent("clicked", { target: "details" })}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <img alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={movie.posterUrl} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_34%,rgba(0,0,0,.18)_55%,rgba(0,0,0,.84)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-white/86 lg:text-[13px]">
              <span className="inline-flex items-center gap-1 text-cinema-amber">
                <Star size={14} fill="currentColor" />
                {movie.rating}
              </span>
              <span>{movie.releaseYear}</span>
              <span>{formatDuration(movie.durationMinutes)}</span>
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white lg:text-[15px] 2xl:text-base">{movie.title}</h3>
            <p className="mt-1.5 line-clamp-1 text-xs font-medium text-white/58 lg:text-[13px]">{movie.genres.map((genre) => genre.name).join(" / ")}</p>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition duration-300 group-hover:opacity-100">
        <Link className="grid size-9 place-items-center rounded-full bg-cinema-cyan text-slate-950 shadow-lg lg:size-10" href={`/watch/${movie.id}`} onClick={() => recordEvent("play", { target: "watch" })}>
          <Play size={17} fill="currentColor" />
        </Link>
        <FavoriteButton className="grid size-9 place-items-center rounded-full border-white/20 bg-black/50 p-0 backdrop-blur lg:size-10" initialFavorite={favorite} movieId={movie.id} />
      </div>
    </article>
  );
}
