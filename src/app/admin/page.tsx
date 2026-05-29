import { BarChart3, Film, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCatalogMovies } from "@/services/catalog-service";

export default async function AdminPage() {
  const movies = await getCatalogMovies({ includeDrafts: true });

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white">Painel Admin</h1>
            <p className="mt-2 text-cinema-muted">Operacao inicial para catalogo, uploads e streaming futuro.</p>
          </div>
          <Button href="/admin/movies/new" icon={<Plus size={18} />}>
            Novo conteudo
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {([
            ["Conteudos", movies.length, Film],
            ["Publicados", movies.filter((movie) => movie.status === "published").length, BarChart3],
            ["Usuarios mock", 1248, Users],
          ] as [string, number, LucideIcon][]).map(([label, value, Icon]) => (
            <GlassPanel className="p-5" key={String(label)}>
              <Icon className="text-cinema-cyan" size={22} />
              <p className="mt-5 text-sm text-cinema-muted">{String(label)}</p>
              <p className="mt-1 text-3xl font-semibold text-white">{String(value)}</p>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="mt-8 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Ultimos conteudos</h2>
          </div>
          <div className="divide-y divide-white/10">
            {movies.slice(0, 6).map((movie) => (
              <a className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/5" href={`/admin/movies/${movie.id}/edit`} key={movie.id}>
                <img alt="" className="size-16 rounded-md object-cover" src={movie.posterUrl} />
                <div>
                  <p className="font-semibold text-white">{movie.title}</p>
                  <p className="text-sm text-cinema-muted">{movie.type} / {movie.releaseYear}</p>
                </div>
                <span className="rounded-full border border-cinema-cyan/30 bg-cinema-cyan/10 px-3 py-1 text-xs text-cinema-cyan">
                  {movie.status}
                </span>
              </a>
            ))}
          </div>
        </GlassPanel>
      </main>
    </AppShell>
  );
}
