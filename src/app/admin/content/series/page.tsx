import { ContentTable } from "@/components/admin/content/ContentTable";
import { getCatalogMovies } from "@/services/catalog-service";

export default async function AdminSeriesStudioPage() {
  const series = (await getCatalogMovies({ includeDrafts: true })).filter((movie) => movie.type === "series");
  return <ContentTable movies={series} title="Gerenciamento de series" />;
}
