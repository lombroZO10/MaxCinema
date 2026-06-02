import { MediaLibrary } from "@/components/admin/media/MediaLibrary";
import { getCatalogMovies } from "@/services/catalog-service";

export default async function AdminMediaPage() {
  const movies = await getCatalogMovies({ includeDrafts: true });
  return <MediaLibrary movies={movies} />;
}
