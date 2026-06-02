import type { Movie } from "@/types/domain";
import type { RecommendationContext } from "@/services/recommendation/recommendation-score";

export type SimilarTasteSignal = {
  label: string;
  score: number;
  description: string;
};

export function buildSimilaritySignals(
  movies: Movie[],
  context: RecommendationContext,
  liveSimilarity: { averageScore: number; count: number } = { averageScore: 0, count: 0 },
): SimilarTasteSignal[] {
  const watchedGenres = new Set(
    context.progressItems.flatMap(({ movie }) => movie.genres.map((genre) => genre.slug)),
  );
  const favoriteGenres = new Set(
    movies
      .filter((movie) => context.favoriteIds.includes(movie.id))
      .flatMap((movie) => movie.genres.map((genre) => genre.slug)),
  );

  const overlap = new Set([...watchedGenres, ...favoriteGenres]).size;

  return [
    {
      label: "Usuarios parecidos",
      score: liveSimilarity.count ? Math.min(98, Math.round(liveSimilarity.averageScore)) : Math.min(94, 58 + overlap * 9),
      description: liveSimilarity.count
        ? `${liveSimilarity.count} perfis proximos calculados por historico e generos.`
        : "Agrupamento preparado para user_similarity e recomendacoes colaborativas.",
    },
    {
      label: "Afinidade editorial",
      score: Math.min(96, 64 + context.progressItems.length * 6 + context.favoriteIds.length * 4),
      description: "Leitura combinada de favoritos, generos e taxa de conclusao.",
    },
  ];
}
