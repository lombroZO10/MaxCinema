import { Play, Star, Tv } from "lucide-react";
import type { Movie } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { MovieRail } from "@/components/movie/MovieRail";
import { getRelatedMovies } from "@/services/content-service";
import type { ScoredMovie } from "@/services/recommendation/recommendation-score";
import { formatDuration } from "@/utils/format";

export function DetailView({
  movie,
  favorite = false,
  favoriteIds = [],
  intelligence,
}: {
  movie: Movie;
  favorite?: boolean;
  favoriteIds?: string[];
  intelligence?: ScoredMovie;
}) {
  const related = getRelatedMovies(movie.id);

  return (
    <main className="cinema-bg min-h-screen">
      <section className="relative min-h-[820px] overflow-hidden">
        <img alt="" className="absolute inset-0 h-full w-full object-cover" src={movie.backdropUrl} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_35%,rgba(3,6,9,.46)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
        <div className="relative z-10 mx-auto grid min-h-[820px] max-w-7xl items-center gap-10 px-5 py-28 md:grid-cols-[320px_1fr] md:px-10">
          <div className="relative mx-auto w-full max-w-[310px] rotate-[-1.5deg] rounded-xl border border-white/14 bg-white/6 p-2 shadow-[0_34px_120px_rgba(0,0,0,.58)] md:mx-0">
            <img alt={movie.title} className="aspect-[2/3] rounded-lg object-cover" src={movie.posterUrl} />
            <div className="absolute -inset-1 -z-10 rounded-xl bg-cinema-cyan/18 blur-2xl" />
          </div>

          <div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-none text-white md:text-8xl">{movie.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-white/78">
              <span className="inline-flex items-center gap-1 text-cinema-amber">
                <Star size={15} fill="currentColor" />
                {movie.rating}
              </span>
              <span>{movie.releaseYear}</span>
              <span>{formatDuration(movie.durationMinutes)}</span>
              <span>{movie.maturityRating}</span>
              <span>{movie.type === "series" ? "Serie" : "Filme"}</span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-cinema-muted">{movie.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span className="rounded-full border border-white/14 bg-white/7 px-3 py-1 text-xs text-white/78" key={genre.id}>
                  {genre.name}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href={`/watch/${movie.id}`} icon={<Play size={18} fill="currentColor" />}>
                Assistir
              </Button>
              <Button icon={<Tv size={18} />} variant="secondary">
                Trailer
              </Button>
              <FavoriteButton initialFavorite={favorite} label movieId={movie.id} />
            </div>
            <div className="mt-8 text-sm text-white/80">
              <span className="text-cinema-muted">Elenco: </span>
              {movie.cast.join(", ")}
            </div>
            {intelligence ? (
              <div className="mt-6 max-w-xl rounded-xl border border-cinema-cyan/22 bg-cinema-cyan/8 p-4">
                <p className="text-sm font-semibold text-cinema-cyan">Selecionado especialmente para voce</p>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  {intelligence.label}. Usuarios com sinais parecidos tendem a reagir bem a este conteudo.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {movie.seasons?.length ? (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-10">
          <h2 className="mb-5 text-2xl font-semibold text-white">Episodios</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {movie.seasons.flatMap((season) =>
              season.episodes.map((episode) => (
                <article className="glass grid grid-cols-[130px_1fr] overflow-hidden rounded-lg" key={episode.id}>
                  <img alt="" className="h-full min-h-28 object-cover" src={episode.posterUrl} />
                  <div className="p-4">
                    <p className="text-xs text-cinema-cyan">E{episode.episodeNumber} / {episode.durationMinutes}m</p>
                    <h3 className="mt-1 font-semibold text-white">{episode.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-cinema-muted">{episode.description}</p>
                  </div>
                </article>
              )),
            )}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
        <MovieRail favoriteIds={favoriteIds} movies={related} title="Recomendacoes relacionadas" />
      </section>
    </main>
  );
}
