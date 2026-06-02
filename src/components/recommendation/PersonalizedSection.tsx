import type { PersonalizedRow } from "@/services/recommendation/recommendation-builder";
import { RecommendationRow } from "@/components/recommendation/RecommendationRow";

export function PersonalizedSection({
  rows,
  favoriteIds,
}: {
  rows: PersonalizedRow[];
  favoriteIds: string[];
}) {
  if (!rows.length) return null;

  return (
    <div className="space-y-10 lg:space-y-12">
      {rows.map((row) => (
        <RecommendationRow favoriteIds={favoriteIds} key={row.id} row={row} />
      ))}
    </div>
  );
}
