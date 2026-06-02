import { notFound } from "next/navigation";
import { DetailView } from "@/components/movie/DetailView";
import { getCatalogMovies, getMovieBySlug } from "@/services/catalog-service";
import { getLiveRecommendationSignals } from "@/services/recommendation/recommendation-engine";
import { scoreMovie } from "@/services/recommendation/recommendation-score";
import { getFavoriteMovieIds, getWatchProgressItems } from "@/services/user-library-service";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [movie, favoriteIds, progressItems, catalog] = await Promise.all([getMovieBySlug(slug), getFavoriteMovieIds(), getWatchProgressItems(), getCatalogMovies()]);
  if (!movie) notFound();

  const signals = await getLiveRecommendationSignals(catalog);
  const intelligence = scoreMovie(movie, {
    favoriteIds,
    progressItems,
    genrePreferenceScores: signals.genrePreferenceScores,
    contentScoreMap: signals.contentScoreMap,
  });

  return <DetailView favorite={favoriteIds.includes(movie.id)} favoriteIds={favoriteIds} intelligence={intelligence} movie={movie} />;
}
