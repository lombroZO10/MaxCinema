"use client";

import { motion } from "framer-motion";
import { Heart, Play, Star } from "lucide-react";
import Link from "next/link";
import type { Movie } from "@/types/domain";
import { formatDuration } from "@/utils/format";

export function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      whileHover={{ y: -8, scale: 1.035, rotateX: 3 }}
      className="group relative min-w-[168px] overflow-hidden rounded-lg border border-white/10 bg-white/6 shadow-[0_18px_60px_rgba(0,0,0,0.36)] md:min-w-[208px]"
    >
      <Link aria-label={`Abrir ${movie.title}`} href={`/movie/${movie.slug}`}>
        <div className="poster-shine relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            loading={priority ? "eager" : "lazy"}
            src={movie.posterUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/12 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/82">
              <span className="inline-flex items-center gap-1 text-cinema-amber">
                <Star size={13} fill="currentColor" />
                {movie.rating}
              </span>
              <span>{movie.releaseYear}</span>
              <span>{formatDuration(movie.durationMinutes)}</span>
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-cinema-muted">
              {movie.genres.map((genre) => genre.name).join(" / ")}
            </p>
          </div>
        </div>
      </Link>
      <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 ring-1 ring-cinema-cyan/70 shadow-[0_0_42px_rgba(19,200,255,0.34)] transition group-hover:opacity-100" />
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
        <Link
          aria-label={`Assistir ${movie.title}`}
          className="grid size-9 place-items-center rounded-full bg-cinema-cyan text-slate-950 shadow-lg"
          href={`/watch/${movie.id}`}
        >
          <Play size={16} fill="currentColor" />
        </Link>
        <button
          aria-label={`Favoritar ${movie.title}`}
          className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/42 text-white backdrop-blur"
          type="button"
        >
          <Heart size={16} />
        </button>
      </div>
    </motion.article>
  );
}
