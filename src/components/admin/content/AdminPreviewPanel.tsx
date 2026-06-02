import { Play, Star } from "lucide-react";
import type { Movie } from "@/types/domain";

export function AdminPreviewPanel({ movie }: { movie?: Movie }) {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Preview</h2>
        <span className="text-xs text-cinema-cyan">card + detalhe</span>
      </div>
      {movie ? (
        <div className="mt-5">
          <div className="relative overflow-hidden rounded-lg border border-white/10">
            <img alt="" className="aspect-[2/3] w-full object-cover" src={movie.posterUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="flex items-center gap-1 text-xs text-cinema-amber"><Star size={13} fill="currentColor" /> {movie.rating}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{movie.title}</h3>
              <p className="mt-1 text-xs text-white/58">{movie.releaseYear} / {movie.durationMinutes}m</p>
            </div>
          </div>
          <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" type="button">
            <Play size={16} fill="currentColor" />
            Pre-visualizar
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-cinema-muted">O preview lateral mostra como o conteudo aparecera nos cards e na pagina de detalhes.</p>
      )}
    </aside>
  );
}
