"use client";

import { motion } from "framer-motion";
import { Info, Play } from "lucide-react";
import type { Movie } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/utils/format";

export function HeroFeature({ movie }: { movie: Movie }) {
  return (
    <section className="relative min-h-[720px] overflow-hidden lg:min-h-[760px]">
      <img alt="" className="absolute inset-0 h-full w-full object-cover" src={movie.backdropUrl} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.86)_24%,rgba(3,6,9,.2)_58%,rgba(3,6,9,.72)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.06)_0%,rgba(3,6,9,.12)_48%,#030609_100%)]" />
      <div className="absolute right-[10%] top-[18%] hidden h-40 w-40 rounded-full bg-cinema-cyan/20 blur-3xl lg:block" />

      <div className="relative z-10 flex min-h-[720px] items-center px-5 pb-32 pt-28 md:px-10 lg:px-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
          initial={{ opacity: 0, y: 26 }}
          transition={{ duration: 0.65 }}
        >
          <p className="mb-4 text-lg font-semibold text-white/88">Em destaque</p>
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.95] text-white md:text-8xl">
            {movie.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-white/78">
            <span>{movie.releaseYear}</span>
            <span className="h-1 w-1 rounded-full bg-cinema-cyan" />
            <span>{formatDuration(movie.durationMinutes)}</span>
            <span className="h-1 w-1 rounded-full bg-cinema-cyan" />
            <span>{movie.maturityRating}</span>
            <span className="h-1 w-1 rounded-full bg-cinema-cyan" />
            <span>{movie.genres.map((genre) => genre.name).join(" / ")}</span>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cinema-muted md:text-lg">
            {movie.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={`/watch/${movie.id}`} icon={<Play size={18} fill="currentColor" />}>
              Assistir agora
            </Button>
            <Button href={`/movie/${movie.slug}`} icon={<Info size={18} />} variant="secondary">
              Mais detalhes
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
