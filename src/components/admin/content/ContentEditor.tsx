import type { Movie } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/admin/content/UploadDropzone";

const tabs = ["Geral", "Midia", "Generos", "SEO", "Publicacao", "Avancado"];

export function ContentEditor({
  action,
  movie,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  movie?: Movie;
  error?: string;
}) {
  return (
    <form action={action} className="rounded-xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab, index) => (
          <button
            className={index === 0 ? "rounded-md bg-cinema-cyan px-3 py-2 text-xs font-semibold text-slate-950" : "rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-white/62"}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Titulo</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.title} name="title" required />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Slug</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.slug} name="slug" placeholder="gerado pelo titulo" />
        </label>
        <label className="md:col-span-2">
          <span className="flex justify-between text-xs font-semibold uppercase text-white/58">
            Descricao
            <span>{movie?.description.length ?? 0}/600</span>
          </span>
          <textarea className="mt-2 min-h-32 w-full rounded-md border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.description} maxLength={600} name="description" required />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Ano</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.releaseYear} name="releaseYear" type="number" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Duracao</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.durationMinutes} name="durationMinutes" type="number" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Classificacao</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.maturityRating} name="maturityRating" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">Genero principal</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.genres[0]?.name} name="genre" />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-white/58">Mux Playback ID</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" defaultValue={movie?.muxPlaybackId} name="muxPlaybackId" />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase text-white/58">Trailer / Video URL</span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
            defaultValue={movie?.trailerUrl}
            name="trailerUrl"
            placeholder="https://.../video.mp4 ou https://.../playlist.m3u8"
            type="url"
          />
          <span className="mt-2 block text-xs text-white/42">
            O player usa Mux Playback ID primeiro. Se ele estiver vazio, usa esta URL publica.
          </span>
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">SEO title</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" name="seoTitle" />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-white/58">SEO description</span>
          <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" name="seoDescription" />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <UploadDropzone accept="image/*" label={movie ? "Substituir poster" : "Upload de poster"} name="poster" />
        <UploadDropzone accept="image/*" label={movie ? "Substituir backdrop" : "Upload de backdrop"} name="backdrop" />
        <UploadDropzone accept="video/*,.m3u8" label={movie ? "Substituir video" : "Upload de trailer/video"} name="trailer" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
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

      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" type="button">Pre-visualizar</Button>
        <Button variant="secondary" type="submit">Salvar rascunho</Button>
        <Button type="submit">Publicar</Button>
      </div>
    </form>
  );
}
