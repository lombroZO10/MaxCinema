import type { Movie } from "@/types/domain";
import { MovieCard } from "@/components/movie/MovieCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

export function MovieRail({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <section className="relative">
      <SectionTitle title={title} />
      <div className="flex snap-x gap-4 overflow-x-auto pb-6 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {movies.map((movie, index) => (
          <div className="snap-start" key={movie.id}>
            <MovieCard movie={movie} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
