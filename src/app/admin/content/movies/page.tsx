import { MovieStudioManager } from "@/components/admin/movies/MovieStudioManager";
import { getAdminMovieIndex } from "@/services/admin/admin-movie-index-service";

export default async function AdminMoviesStudioPage() {
  const index = await getAdminMovieIndex();
  return <MovieStudioManager index={index} />;
}
