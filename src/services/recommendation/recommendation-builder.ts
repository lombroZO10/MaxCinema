import type { Movie } from "@/types/domain";
import type { RecommendationContext, ScoredMovie } from "@/services/recommendation/recommendation-score";
import { scoreMovie } from "@/services/recommendation/recommendation-score";

export type PersonalizedRow = {
  id: string;
  title: string;
  description: string;
  intent: "personal" | "behavior" | "trend" | "discovery" | "continue";
  items: ScoredMovie[];
};

function uniqueByMovie(items: ScoredMovie[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.movie.id)) return false;
    seen.add(item.movie.id);
    return true;
  });
}

function topGenres(context: RecommendationContext) {
  const genreScores = new Map<string, { name: string; score: number }>();

  for (const { movie, item } of context.progressItems) {
    const completion = item.durationSeconds ? item.progressSeconds / item.durationSeconds : 0;
    const weight = completion > 0.85 ? 10 : completion > 0.35 ? 6 : 2;
    for (const genre of movie.genres) {
      const current = genreScores.get(genre.slug) ?? { name: genre.name, score: 0 };
      genreScores.set(genre.slug, { name: genre.name, score: current.score + weight });
    }
  }

  return Array.from(genreScores.values()).sort((a, b) => b.score - a.score);
}

export function buildPersonalizedRows(movies: Movie[], context: RecommendationContext): PersonalizedRow[] {
  const watchedIds = new Set(context.progressItems.map(({ movie }) => movie.id));
  const scored = movies
    .map((movie) => scoreMovie(movie, context))
    .sort((a, b) => b.score - a.score || b.movie.rating - a.movie.rating);

  const topGenre = topGenres(context)[0]?.name;
  const notStarted = scored.filter((item) => !watchedIds.has(item.movie.id));
  const favoritesBased = notStarted.filter((item) => item.reasons.includes("favorite_signal") || item.reasons.includes("genre_match"));
  const shortRuntime = notStarted.filter((item) => item.movie.durationMinutes <= 110);
  const series = notStarted.filter((item) => item.movie.type === "series");
  const discovery = notStarted
    .filter((item) => item.reasons.includes("discovery") || !item.reasons.includes("genre_match"))
    .sort((a, b) => b.movie.rating - a.movie.rating);
  const trending = [...notStarted].sort((a, b) => b.movie.rating - a.movie.rating || b.movie.releaseYear - a.movie.releaseYear);

  const rows: PersonalizedRow[] = [
    {
      id: "recommended-for-you",
      title: "Recomendados para voce",
      description: topGenre
        ? `Priorizando seu perfil ${topGenre}, favoritos, conclusao e qualidade editorial.`
        : "Um ponto de partida inteligente baseado em qualidade, novidade e diversidade.",
      intent: "personal",
      items: uniqueByMovie(favoritesBased.length ? favoritesBased : notStarted).slice(0, 8),
    },
    {
      id: "tonight",
      title: "Filmes para hoje a noite",
      description: "Selecao com alta avaliacao, ritmo forte e boa afinidade para assistir agora.",
      intent: "trend",
      items: uniqueByMovie(trending).slice(0, 8),
    },
    {
      id: "short-for-you",
      title: "Filmes curtos para voce",
      description: "Opcoes mais diretas quando voce quer decidir rapido e assistir sem maratona longa.",
      intent: "behavior",
      items: uniqueByMovie(shortRuntime).slice(0, 8),
    },
    {
      id: "binge-now",
      title: "Maratone agora",
      description: "Series e universos serializados para uma sessao mais longa.",
      intent: "behavior",
      items: uniqueByMovie(series).slice(0, 8),
    },
    {
      id: "discovery",
      title: "Descubra algo diferente",
      description: "Diversidade inteligente para tirar seu catalogo da bolha sem perder qualidade.",
      intent: "discovery",
      items: uniqueByMovie(discovery).slice(0, 8),
    },
  ];

  return rows.filter((row) => row.items.length);
}
