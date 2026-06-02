import { Copy, Eye, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  deleteMovieAction,
  duplicateMovieAction,
  publishMovieAction,
  toggleFeaturedMovieAction,
  unpublishMovieAction,
} from "@/app/admin/actions";
import { ContentStatusBadge } from "@/components/admin/shared/ContentStatusBadge";
import type { Movie } from "@/types/domain";

export function ContentTable({ movies, title = "Ultimos conteudos" }: { movies: Movie[]; title?: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Link className="text-sm font-semibold text-cinema-cyan" href="/admin/content/new">
          Novo conteudo
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="text-xs uppercase text-white/42">
            <tr>
              <th className="px-5 py-4">Titulo</th>
              <th className="px-5 py-4">Tipo</th>
              <th className="px-5 py-4">Ano</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Destaque</th>
              <th className="px-5 py-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {movies.map((movie) => (
              <tr className="transition hover:bg-white/[0.045]" key={movie.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img alt="" className="size-14 rounded-md object-cover ring-1 ring-white/10" src={movie.posterUrl} />
                    <div>
                      <p className="font-semibold text-white">{movie.title}</p>
                      <p className="text-xs text-cinema-muted">{movie.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-white/70">{movie.type}</td>
                <td className="px-5 py-4 text-sm text-white/70">{movie.releaseYear}</td>
                <td className="px-5 py-4">
                  <form action={movie.status === "published" ? unpublishMovieAction.bind(null, movie.id) : publishMovieAction.bind(null, movie.id)}>
                    <button className="transition hover:scale-105" title={movie.status === "published" ? "Despublicar" : "Publicar"} type="submit">
                      <ContentStatusBadge status={movie.status} />
                    </button>
                  </form>
                </td>
                <td className="px-5 py-4 text-cinema-amber">
                  <form action={toggleFeaturedMovieAction.bind(null, movie.id, !movie.featured)}>
                    <button className="grid size-9 place-items-center rounded-md border border-white/10 text-cinema-amber transition hover:bg-cinema-amber/10" title={movie.featured ? "Remover destaque" : "Marcar destaque"} type="submit">
                      {movie.featured ? <Star size={17} fill="currentColor" /> : <Star size={17} />}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2 text-white/55">
                    <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/movie/${movie.slug}`} title="Ver pagina publica"><Eye size={15} /></Link>
                    <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/admin/content/${movie.id}/edit`} title="Editar"><Pencil size={15} /></Link>
                    <form action={duplicateMovieAction.bind(null, movie.id)}>
                      <button className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" title="Duplicar" type="submit"><Copy size={15} /></button>
                    </form>
                    <form action={deleteMovieAction.bind(null, movie.id)}>
                      <button className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-rose-200" title="Excluir" type="submit"><Trash2 size={15} /></button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
