import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Movie } from "@/types/domain";

const uploadFields = [
  ["poster", "Poster"],
  ["backdrop", "Backdrop"],
  ["trailer", "Trailer"],
] as const;

export function AdminMovieForm({
  action,
  movie,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  movie?: Movie;
  error?: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      {error ? (
        <div className="rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Titulo</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.title} name="title" required />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Slug</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.slug} name="slug" placeholder="gerado pelo titulo se vazio" />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-white/58">Descricao</span>
          <textarea className="mt-2 min-h-28 w-full rounded-md border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.description} name="description" required />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Ano</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.releaseYear} name="releaseYear" type="number" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Duracao em minutos</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.durationMinutes} name="durationMinutes" type="number" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Classificacao indicativa</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.maturityRating} name="maturityRating" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Genero principal</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.genres[0]?.name} name="genre" />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-white/58">Mux Playback ID</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.muxPlaybackId} name="muxPlaybackId" placeholder="futuro playback_id do Mux" />
        </label>
      </div>

      {!movie ? (
        <div className="grid gap-4 md:grid-cols-3">
          {uploadFields.map(([name, label]) => (
            <label className="grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-white/18 bg-white/5 text-center text-sm text-cinema-muted transition hover:border-cinema-cyan/50 hover:text-white" key={name}>
              <span>
                <UploadCloud className="mx-auto mb-3 text-cinema-cyan" size={24} />
                Upload de {label}
              </span>
              <input accept={name === "trailer" ? "video/*" : "image/*"} className="sr-only" name={name} type="file" />
            </label>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Tipo</span>
          <select className="mt-2 h-12 w-full rounded-md border border-white/12 bg-[#07111a] px-4 text-sm text-white outline-none" defaultValue={movie?.type ?? "movie"} name="type">
            <option value="movie">movie</option>
            <option value="series">series</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Status</span>
          <select className="mt-2 h-12 w-full rounded-md border border-white/12 bg-[#07111a] px-4 text-sm text-white outline-none" defaultValue={movie?.status ?? "draft"} name="status">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
        <label className="flex items-end gap-3 rounded-md border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/80">
          <input className="size-4 accent-cinema-cyan" defaultChecked={movie?.featured} name="featured" type="checkbox" />
          Destaque na home
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="submit">
          Salvar rascunho
        </Button>
        <Button type="submit">Publicar conteudo</Button>
      </div>
    </form>
  );
}
