import { AppShell } from "@/components/layout/AppShell";
import { MovieRail } from "@/components/movie/MovieRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCatalogMovies } from "@/services/catalog-service";

export default async function FavoritesPage() {
  const favorites = (await getCatalogMovies()).slice(0, 5);

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        {favorites.length ? (
          <MovieRail movies={favorites} title="Favoritos" />
        ) : (
          <EmptyState description="Quando voce favoritar filmes e series, eles aparecem aqui." title="Sua lista ainda esta vazia" />
        )}
      </main>
    </AppShell>
  );
}
