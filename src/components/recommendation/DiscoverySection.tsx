import type { PersonalizedRow } from "@/services/recommendation/recommendation-builder";
import { RecommendationRow } from "@/components/recommendation/RecommendationRow";

export function DiscoverySection({
  row,
  favoriteIds,
}: {
  row?: PersonalizedRow;
  favoriteIds: string[];
}) {
  if (!row) return null;
  return <RecommendationRow favoriteIds={favoriteIds} row={row} />;
}
