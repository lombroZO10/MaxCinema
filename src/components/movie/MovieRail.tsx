import type { Movie } from "@/types/domain";
import { PremiumRowCarousel } from "@/components/browse/PremiumRowCarousel";
import { MovieCard } from "@/components/movie/MovieCard";

export function MovieRail({
  title,
  movies,
  favoriteIds = [],
  subtitle,
  bannerUrl,
  accentColor,
  showCollectionBanner = false,
  posterFallbackUrl,
  showRating = true,
  showDuration = true,
  showGenres = true,
  showFavoriteButton = true,
}: {
  title: string;
  movies: Movie[];
  favoriteIds?: string[];
  subtitle?: string;
  bannerUrl?: string;
  accentColor?: string;
  showCollectionBanner?: boolean;
  posterFallbackUrl?: string;
  showRating?: boolean;
  showDuration?: boolean;
  showGenres?: boolean;
  showFavoriteButton?: boolean;
}) {
  return (
    <PremiumRowCarousel badge={showCollectionBanner ? "Colecao" : undefined} subtitle={subtitle} title={title}>
      {showCollectionBanner && bannerUrl ? (
        <div
          className="relative min-h-[220px] w-[min(72vw,720px)] shrink-0 snap-start overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_18px_70px_rgba(0,0,0,.36)]"
          style={{ boxShadow: accentColor ? `0 18px 70px rgba(0,0,0,.36), 0 0 0 1px ${accentColor}33` : undefined }}
        >
          <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={bannerUrl} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,9,.88)_0%,rgba(3,6,9,.46)_48%,rgba(3,6,9,.12)_100%)]" />
          <div className="absolute bottom-0 left-0 max-w-md p-5">
            <p className="text-xs font-semibold uppercase text-white/58">Colecao editorial</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      {movies.map((movie, index) => (
        <div className="snap-start" key={movie.id}>
          <MovieCard
            favorite={favoriteIds.includes(movie.id)}
            movie={movie}
            posterFallbackUrl={posterFallbackUrl}
            priority={index < 2}
            showDuration={showDuration}
            showFavoriteButton={showFavoriteButton}
            showGenres={showGenres}
            showRating={showRating}
          />
        </div>
      ))}
    </PremiumRowCarousel>
  );
}
