import { Image as ImageIcon, PlaySquare } from "lucide-react";
import type { Movie } from "@/types/domain";

export function MediaLibrary({ movies }: { movies: Movie[] }) {
  const assets = movies.flatMap((movie) => [
    { id: `${movie.id}-poster`, title: `${movie.title} poster`, url: movie.posterUrl, type: "poster" },
    { id: `${movie.id}-backdrop`, title: `${movie.title} backdrop`, url: movie.backdropUrl, type: "backdrop" },
  ]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Biblioteca de midia</h2>
        <span className="text-sm text-cinema-muted">{assets.length} assets</span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.slice(0, 12).map((asset) => (
          <article className="group overflow-hidden rounded-lg border border-white/10 bg-black/20" key={asset.id}>
            <img alt="" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" src={asset.url} />
            <div className="flex items-center gap-3 p-3">
              {asset.type === "poster" ? <ImageIcon className="text-cinema-cyan" size={16} /> : <PlaySquare className="text-cinema-amber" size={16} />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{asset.title}</p>
                <p className="text-xs text-cinema-muted">{asset.type}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
