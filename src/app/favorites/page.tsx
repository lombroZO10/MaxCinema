import { AppShell } from "@/components/layout/AppShell";
import { MovieRail } from "@/components/movie/MovieRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFavoriteMovieIds, getFavoriteMovies } from "@/services/user-library-service";

export default async function FavoritesPage() {
  const [favorites, favoriteIds] = await Promise.all([getFavoriteMovies(), getFavoriteMovieIds()]);

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        {favorites.length ? (
          <MovieRail favoriteIds={favoriteIds} movies={favorites} title="Favoritos" />
        ) : (
          <EmptyState description="Quando voce favoritar filmes e series, eles aparecem aqui." title="Sua lista ainda esta vazia" />
        )}
      </main>
    </AppShell>
  );
}
