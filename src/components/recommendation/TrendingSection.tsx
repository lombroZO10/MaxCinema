import type { ScoredMovie } from "@/services/recommendation/recommendation-score";
import { PremiumRowCarousel } from "@/components/browse/PremiumRowCarousel";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";

export function TrendingSection({
  items,
  favoriteIds,
}: {
  items: ScoredMovie[];
  favoriteIds: string[];
}) {
  return (
    <PremiumRowCarousel
      subtitle="Ranking vivo por nota, novidade, originais e sinais editoriais."
      title="Tendencias para seu perfil"
    >
      {items.slice(0, 8).map((item) => (
        <div className="snap-start" key={`trend-${item.movie.id}`}>
          <RecommendationCard favorite={favoriteIds.includes(item.movie.id)} item={item} />
        </div>
      ))}
    </PremiumRowCarousel>
  );
}
