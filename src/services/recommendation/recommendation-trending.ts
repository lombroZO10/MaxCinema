import type { Movie } from "@/types/domain";
import type { ScoredMovie } from "@/services/recommendation/recommendation-score";

export function buildTrending(movies: Movie[], contentScoreMap = new Map<string, number>()): ScoredMovie[] {
  return movies
    .map((movie, index) => {
      const recencyBoost = Math.max(0, movie.releaseYear - (new Date().getFullYear() - 3)) * 3;
      const originalBoost = movie.genres.some((genre) => genre.slug === "original") ? 8 : 0;
      const liveScore = contentScoreMap.get(movie.id) ?? 0;
      const score = movie.rating * 10 + recencyBoost + originalBoost + liveScore * 0.75 - index;

      return {
        movie,
        score,
        match: Math.min(98, Math.round(70 + score / 6)),
        reasons: ["trending" as const],
        label: liveScore > 0 ? "Em alta com dados reais" : "Em alta no Cinema OS",
      };
    })
    .sort((a, b) => b.score - a.score);
}
