import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCatalogMovies } from "@/services/catalog-service";

export default async function AdminMoviesPage() {
  const movies = await getCatalogMovies({ includeDrafts: true });

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white">Conteudos</h1>
            <p className="mt-2 text-cinema-muted">Filmes, series, temporadas e episodios.</p>
          </div>
          <Button href="/admin/movies/new">Cadastrar</Button>
        </div>
        <GlassPanel className="overflow-hidden">
          {movies.map((movie) => (
            <a className="grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 hover:bg-white/5" href={`/admin/movies/${movie.id}/edit`} key={movie.id}>
              <img alt="" className="size-16 rounded-md object-cover" src={movie.posterUrl} />
              <div>
                <p className="font-semibold text-white">{movie.title}</p>
                <p className="text-sm text-cinema-muted">{movie.genres.map((genre) => genre.name).join(" / ")}</p>
              </div>
              <span className="text-sm text-white/72">{movie.status}</span>
            </a>
          ))}
        </GlassPanel>
      </main>
    </AppShell>
  );
}
