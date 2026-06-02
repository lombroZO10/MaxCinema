import type { PersonalizedRow } from "@/services/recommendation/recommendation-builder";
import { PremiumRowCarousel } from "@/components/browse/PremiumRowCarousel";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";

export function RecommendationRow({
  row,
  favoriteIds = [],
}: {
  row: PersonalizedRow;
  favoriteIds?: string[];
}) {
  return (
    <PremiumRowCarousel badge="Curadoria" subtitle={row.description} title={row.title}>
      {row.items.map((item) => (
        <div className="snap-start" key={`${row.id}-${item.movie.id}`}>
          <RecommendationCard favorite={favoriteIds.includes(item.movie.id)} item={item} />
        </div>
      ))}
    </PremiumRowCarousel>
  );
}
