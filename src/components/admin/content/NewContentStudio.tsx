"use client";

import {
  CalendarClock,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Video,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createMovieAction } from "@/app/admin/actions";
import { cn } from "@/utils/cn";
import { slugify } from "@/utils/slug";

type Step = "identity" | "visual" | "streaming" | "browse" | "seo" | "publish";
type PreviewTab = "card" | "hero" | "details" | "mobile" | "tv";

type Draft = {
  title: string;
  slug: string;
  description: string;
  releaseYear: string;
  maturityRating: string;
  durationMinutes: string;
  genre: string;
  muxPlaybackId: string;
  trailerUrl: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  isOriginal: boolean;
  intent: "draft" | "publish";
};

function safeUrl(file?: File | null) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

function scoreFromChecks(checks: Record<string, boolean>) {
  const keys = Object.keys(checks);
  if (keys.length === 0) return 0;
  const ok = keys.filter((k) => checks[k]).length;
  return Math.round((ok / keys.length) * 100);
}

function scoreTone(score: number) {
  if (score >= 90) return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100";
  if (score >= 70) return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  return "border-rose-300/18 bg-rose-300/[0.055] text-rose-100";
}

function badgeTone(intent: Draft["intent"]) {
  return intent === "publish"
    ? "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100"
    : "border-white/10 bg-white/[0.04] text-white/70";
}

export function NewContentStudio({ error }: { error?: string }) {
  const [step, setStep] = useState<Step>("identity");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("card");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);

  const [draft, setDraft] = useState<Draft>({
    title: "",
    slug: "",
    description: "",
    releaseYear: "",
    maturityRating: "",
    durationMinutes: "",
    genre: "",
    muxPlaybackId: "",
    trailerUrl: "",
    seoTitle: "",
    seoDescription: "",
    featured: false,
    isOriginal: false,
    intent: "draft",
  });

  const posterPreview = useMemo(() => safeUrl(posterFile), [posterFile]);
  const backdropPreview = useMemo(() => safeUrl(backdropFile), [backdropFile]);
  const trailerName = trailerFile?.name ?? "";

  useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      if (backdropPreview) URL.revokeObjectURL(backdropPreview);
    };
  }, [posterPreview, backdropPreview]);

  const effectiveSlug = draft.slug.trim() ? slugify(draft.slug) : slugify(draft.title);
  const checks = useMemo(() => {
    const hasPoster = Boolean(posterFile);
    const hasBackdrop = Boolean(backdropFile);
    const hasSynopsis = draft.description.trim().length >= 40;
    const hasTrailer = Boolean(trailerFile) || Boolean(draft.trailerUrl.trim()) || Boolean(draft.muxPlaybackId.trim());
    const hasRating = Boolean(draft.maturityRating.trim());
    const hasGenre = Boolean(draft.genre.trim());
    const hasSeo = Boolean(draft.seoTitle.trim()) && Boolean(draft.seoDescription.trim());
    const hasSlug = Boolean(effectiveSlug);
    const hasYear = Boolean(draft.releaseYear.trim());
    return {
      poster: hasPoster,
      backdrop: hasBackdrop,
      synopsis: hasSynopsis,
      trailer: hasTrailer,
      rating: hasRating,
      genres: hasGenre,
      seo: hasSeo,
      slug: hasSlug,
      year: hasYear,
    };
  }, [posterFile, backdropFile, trailerFile, draft, effectiveSlug]);

  const qualityScore = scoreFromChecks(checks);
  const warnings = useMemo(() => {
    const items: string[] = [];
    if (!checks.poster) items.push("Poster ainda nao enviado");
    if (!checks.backdrop) items.push("Backdrop ainda nao enviado");
    if (!checks.synopsis) items.push("Sinopse muito curta (min. 40 caracteres)");
    if (!checks.trailer) items.push("Sem trailer, video ou Mux ID");
    if (!checks.rating) items.push("Sem classificacao");
    if (!checks.genres) items.push("Sem genero principal");
    if (!checks.seo) items.push("SEO incompleto");
    return items;
  }, [checks]);

  const steps: Array<{ id: Step; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: "identity", label: "Identidade", icon: Film },
    { id: "visual", label: "Experiencia Visual", icon: ImageIcon },
    { id: "streaming", label: "Streaming", icon: Video },
    { id: "browse", label: "Aparicao no Browse", icon: LayoutTemplate },
    { id: "seo", label: "SEO", icon: Search },
    { id: "publish", label: "Publicacao", icon: CheckCircle2 },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <form action={createMovieAction} className="space-y-4" encType="multipart/form-data">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Content Studio</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Publicar Conteudo</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Preparacao editorial, midia e streaming. Tudo com preview em tempo real e qualidade de catalogo.
              </p>
            </div>
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold", badgeTone(draft.intent))}>
              <ShieldCheck size={15} />
              {draft.intent === "publish" ? "Publicado ao enviar" : "Rascunho"}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-black/18 p-2 md:grid-cols-6">
            {steps.map(({ id, label, icon: Icon }) => (
              <button
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-md text-xs font-semibold transition",
                  step === id ? "bg-cinema-cyan text-slate-950" : "text-white/64 hover:bg-white/8 hover:text-white",
                )}
                key={id}
                onClick={() => setStep(id)}
                type="button"
              >
                <Icon size={15} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </header>

        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl">
          {step === "identity" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Identidade</h2>
                <span className="text-xs text-white/40">o basico que vira pagina de streaming</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase text-white/58">Titulo</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="title"
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, title: value }));
                      if (!draft.slug.trim()) setDraft((d) => ({ ...d, title: value }));
                    }}
                    placeholder="Ex: Ted 2"
                    required
                    value={draft.title}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="flex items-center justify-between text-xs font-semibold uppercase text-white/58">
                    Slug
                    <span className="text-[11px] font-medium text-white/40">{effectiveSlug || "--"}</span>
                  </span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="slug"
                    onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                    placeholder="gerado pelo titulo"
                    value={draft.slug}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="flex justify-between text-xs font-semibold uppercase text-white/58">
                    Sinopse
                    <span className="text-[11px] font-medium text-white/40">{draft.description.length}/600</span>
                  </span>
                  <textarea
                    className="mt-2 min-h-32 w-full rounded-md border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    maxLength={600}
                    name="description"
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Escreva uma sinopse editorial e humana."
                    required
                    value={draft.description}
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase text-white/58">Ano</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="releaseYear"
                    onChange={(e) => setDraft((d) => ({ ...d, releaseYear: e.target.value }))}
                    type="number"
                    value={draft.releaseYear}
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase text-white/58">Duracao</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="durationMinutes"
                    onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: e.target.value }))}
                    type="number"
                    value={draft.durationMinutes}
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase text-white/58">Classificacao</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="maturityRating"
                    onChange={(e) => setDraft((d) => ({ ...d, maturityRating: e.target.value }))}
                    placeholder="Ex: 14"
                    value={draft.maturityRating}
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase text-white/58">Genero principal</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="genre"
                    onChange={(e) => setDraft((d) => ({ ...d, genre: e.target.value }))}
                    placeholder="Ex: Comedia"
                    value={draft.genre}
                  />
                </label>

                <label className="flex items-end gap-3 rounded-md border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <input
                    checked={draft.featured}
                    className="size-4 accent-cinema-cyan"
                    name="featured"
                    onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                    type="checkbox"
                  />
                  Em destaque
                </label>

                <label className="flex items-end gap-3 rounded-md border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <input
                    checked={draft.isOriginal}
                    className="size-4 accent-cinema-cyan"
                    name="isOriginal"
                    onChange={(e) => setDraft((d) => ({ ...d, isOriginal: e.target.checked }))}
                    type="checkbox"
                  />
                  Original MaxCinema
                </label>
              </div>
            </div>
          ) : null}

          {step === "visual" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Experiencia Visual</h2>
                <span className="text-xs text-white/40">upload + preview imediato</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                  <p className="text-xs font-semibold uppercase text-white/42">Poster</p>
                  <div className="mt-3 grid grid-cols-[120px_1fr] gap-4">
                    <div className="relative overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
                      <img alt="" className="aspect-[2/3] w-full object-cover" src={posterPreview ?? "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=86"} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    </div>
                    <label className="group flex min-h-[140px] cursor-pointer flex-col justify-center rounded-md border border-dashed border-white/18 bg-white/5 p-4 text-sm text-white/60 transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <UploadCloud className="text-cinema-cyan transition group-hover:scale-110" size={18} />
                        Enviar poster
                      </span>
                      <span className="mt-2 text-xs text-white/42">PNG ou JPG. Preview atualiza na hora.</span>
                      <input
                        accept="image/*"
                        className="sr-only"
                        name="poster"
                        onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                  <p className="text-xs font-semibold uppercase text-white/42">Backdrop</p>
                  <div className="mt-3 space-y-3">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
                      <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={backdropPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&h=800&q=86"} />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.85)_44%,rgba(3,6,9,.2)_80%,rgba(3,6,9,.62)_100%)]" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Preview Hero</p>
                        <p className="mt-2 truncate text-base font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                      </div>
                    </div>

                    <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-white/18 bg-white/5 px-4 py-3 text-sm text-white/60 transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <UploadCloud className="text-cinema-cyan transition group-hover:scale-110" size={18} />
                        Enviar backdrop
                      </span>
                      <input
                        accept="image/*"
                        className="sr-only"
                        name="backdrop"
                        onChange={(e) => setBackdropFile(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                      <span className="text-xs text-white/38">16:9 recomendado</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase text-white/42">Assets (arquitetura pronta)</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {[
                    ["Logo transparente", "Em breve"],
                    ["Thumbnail", "Em breve"],
                    ["Banner Mobile", "Em breve"],
                    ["Banner TV", "Em breve"],
                    ["Banner Hero", "Em breve"],
                    ["Banner Colecao", "Em breve"],
                  ].map(([label, note]) => (
                    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3" key={label}>
                      <p className="text-sm font-semibold text-white/75">{label}</p>
                      <p className="mt-1 text-xs text-white/42">{note} (armazenamento e vinculo por filme ainda nao ativados)</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === "streaming" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Streaming</h2>
                <span className="text-xs text-white/40">midia + IDs</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase text-white/58">Mux Playback ID</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="muxPlaybackId"
                    onChange={(e) => setDraft((d) => ({ ...d, muxPlaybackId: e.target.value }))}
                    placeholder="ex: 9t2z6U9h4..."
                    value={draft.muxPlaybackId}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase text-white/58">Trailer / Video URL</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="trailerUrl"
                    onChange={(e) => setDraft((d) => ({ ...d, trailerUrl: e.target.value }))}
                    placeholder="https://.../video.mp4 ou https://.../playlist.m3u8"
                    type="url"
                    value={draft.trailerUrl}
                  />
                  <span className="mt-2 block text-xs text-white/42">O player usa Mux Playback ID primeiro. Se vazio, usa a URL publica.</span>
                </label>

                <div className="rounded-md border border-white/12 bg-white/5 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-white/58">Upload de trailer/video</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-white/18 bg-white/5 px-4 py-3 text-sm text-white/60 transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <UploadCloud className="text-cinema-cyan" size={18} />
                      Enviar arquivo
                    </span>
                    <span className="text-xs text-white/38">{trailerName || "mp4, m3u8, etc"}</span>
                    <input
                      accept="video/*,.m3u8"
                      className="sr-only"
                      name="trailer"
                      onChange={(e) => setTrailerFile(e.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </label>
                </div>

                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-white/42">Cloudflare / Legendas / Audios (arquitetura pronta)</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[
                      ["Cloudflare Stream ID", "Em breve"],
                      ["Legendas", "Em breve (SRT/VTT por idioma)"],
                      ["Audios", "Em breve (tracks)"],
                      ["Resolucoes", "Em breve (gerenciado pelo provider)"],
                    ].map(([label, note]) => (
                      <div className="rounded-md border border-white/10 bg-black/18 p-3" key={label}>
                        <p className="text-sm font-semibold text-white/75">{label}</p>
                        <p className="mt-1 text-xs text-white/42">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === "browse" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Aparicao no Browse</h2>
                <Link className="text-xs font-semibold text-cinema-cyan hover:text-white" href="/admin/home-editor">
                  Abrir Home Editor
                </Link>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                <p className="text-sm font-semibold text-white/80">O que esta nesta tela</p>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  Aqui voce define <span className="font-semibold text-white/72">sinais</span> (Destaque / Original). Apos publicar, a aparicao em Hero, Top 10 e colecoes
                  e gerenciada no Home Editor para evitar duplicacao.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} className="text-cinema-amber" />
                    Em Destaque
                  </span>
                  <input
                    checked={draft.featured}
                    className="size-4 accent-cinema-cyan"
                    name="featured"
                    onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                    type="checkbox"
                  />
                </label>

                <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Film size={16} className="text-cinema-cyan" />
                    Originais MaxCinema
                  </span>
                  <input
                    checked={draft.isOriginal}
                    className="size-4 accent-cinema-cyan"
                    name="isOriginal"
                    onChange={(e) => setDraft((d) => ({ ...d, isOriginal: e.target.checked }))}
                    type="checkbox"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase text-white/42">Colecoes e Secoes (Home Editor)</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {[
                    "Hero Principal",
                    "Populares",
                    "Recomendados",
                    "Lancamentos",
                    "Filmes para hoje a noite",
                    "Top 10",
                    "Continuar assistindo",
                    "Colecoes",
                  ].map((label) => (
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/18 px-3 py-3 text-sm" key={label}>
                      <span className="text-white/70">{label}</span>
                      <span className="text-xs text-white/35">gerenciado la</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === "seo" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">SEO Premium</h2>
                <span className="text-xs text-white/40">preview de busca e compartilhamento</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase text-white/58">SEO title</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="seoTitle"
                    onChange={(e) => setDraft((d) => ({ ...d, seoTitle: e.target.value }))}
                    value={draft.seoTitle}
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase text-white/58">SEO description</span>
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
                    name="seoDescription"
                    onChange={(e) => setDraft((d) => ({ ...d, seoDescription: e.target.value }))}
                    value={draft.seoDescription}
                  />
                </label>

                <div className="rounded-md border border-white/10 bg-black/18 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-white/42">Preview Google</p>
                  <div className="mt-3 rounded-md border border-white/10 bg-[#0b131a] p-4">
                    <p className="text-sm font-semibold text-[#8ab4f8]">{draft.seoTitle.trim() || draft.title || "Titulo SEO"}</p>
                    <p className="mt-1 text-xs text-white/40">maxcinema.com/movie/{effectiveSlug || "slug"}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{draft.seoDescription.trim() || "Descricao SEO aparece aqui."}</p>
                  </div>
                </div>

                <div className="rounded-md border border-white/10 bg-black/18 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-white/42">Preview Compartilhamento</p>
                  <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-[#0b131a]">
                    <div className="relative aspect-[16/9]">
                      <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={backdropPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&h=800&q=86"} />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-semibold text-white">{draft.seoTitle.trim() || draft.title || "Titulo"}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">{draft.seoDescription.trim() || draft.description || "Descricao"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === "publish" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Publicacao Profissional</h2>
                <span className="text-xs text-white/40">fluxos de estudio</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-4 text-left transition",
                    draft.intent === "draft" ? "border-cinema-cyan/45 bg-cinema-cyan/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.045]",
                  )}
                  onClick={() => setDraft((d) => ({ ...d, intent: "draft" }))}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">Salvar Rascunho</span>
                    <span className="mt-1 block text-xs text-white/45">Disponivel no Studio para refinar</span>
                  </span>
                  <CheckCircle2 className="text-cinema-cyan" size={18} />
                </button>

                <button
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-4 text-left transition",
                    draft.intent === "publish" ? "border-emerald-300/28 bg-emerald-300/[0.055]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.045]",
                  )}
                  onClick={() => setDraft((d) => ({ ...d, intent: "publish" }))}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">Publicar Agora</span>
                    <span className="mt-1 block text-xs text-white/45">Vai ao Browse (segundo as regras atuais)</span>
                  </span>
                  <Sparkles className="text-emerald-200" size={18} />
                </button>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-4 text-left opacity-70 md:col-span-2">
                  <span>
                    <span className="block text-sm font-semibold text-white">Agendar / Arquivar</span>
                    <span className="mt-1 block text-xs text-white/45">Arquitetura pronta. Status alem de draft/published ainda nao existe no banco.</span>
                  </span>
                  <CalendarClock className="text-white/45" size={18} />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button className="inline-flex h-11 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" type="button">
                  <Link2 size={16} />
                  Validar
                </button>
                <button className="inline-flex h-11 items-center gap-2 rounded-md bg-cinema-cyan px-5 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]" type="submit">
                  <CheckCircle2 size={16} />
                  Enviar para o Studio
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Hidden: fields that are still part of submit but not in current step */}
        <input name="intent" type="hidden" value={draft.intent} />
        <input name="status" type="hidden" value={draft.intent === "publish" ? "published" : "draft"} />
        <input name="type" type="hidden" value="movie" />
      </form>

      <aside className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Preview</h2>
            <span className="text-xs text-cinema-cyan">tempo real</span>
          </div>

          <div className="mt-4 grid grid-cols-5 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
            {([["card", "Card"], ["hero", "Hero"], ["details", "Detalhes"], ["mobile", "Mobile"], ["tv", "TV"]] as const).map(([key, label]) => (
              <button
                className={cn(
                  "inline-flex h-10 items-center justify-center text-[11px] font-semibold transition",
                  previewTab === key ? "bg-cinema-cyan text-slate-950" : "text-white/64 hover:bg-white/8 hover:text-white",
                )}
                key={key}
                onClick={() => setPreviewTab(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[#030609]">
            {previewTab === "card" ? (
              <div className="grid grid-cols-[88px_1fr] gap-3 p-4">
                <img alt="" className="aspect-[2/3] w-full rounded-md object-cover" src={posterPreview ?? "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=86"} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase text-white/45">Movie Card</p>
                  <p className="mt-2 truncate text-base font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                  <p className="mt-1 truncate text-xs text-white/55">
                    {draft.releaseYear || "--"} / {draft.durationMinutes ? `${draft.durationMinutes}m` : "--"} / {draft.genre || "Sem genero"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/62">{draft.description || "Sinopse aparece aqui."}</p>
                </div>
              </div>
            ) : null}

            {previewTab === "hero" ? (
              <div className="relative aspect-[16/9]">
                <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={backdropPreview ?? posterPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&h=800&q=86"} />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_34%,rgba(3,6,9,.18)_78%,rgba(3,6,9,.65)_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Hero</p>
                  <p className="mt-2 text-lg font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                  <p className="mt-1 text-xs text-white/62">{draft.genre || "Sem genero"} {draft.maturityRating ? `/ ${draft.maturityRating}` : ""}</p>
                </div>
              </div>
            ) : null}

            {previewTab === "details" ? (
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase text-white/45">Pagina de detalhes</p>
                <div className="mt-3 grid gap-3">
                  <div className="relative aspect-[16/8] overflow-hidden rounded-md border border-white/10">
                    <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={backdropPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&h=800&q=86"} />
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-base font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                      <p className="mt-1 text-xs text-white/65">
                        {draft.releaseYear || "--"} / {draft.durationMinutes ? `${draft.durationMinutes}m` : "--"} / {draft.genre || "Sem genero"}
                      </p>
                    </div>
                  </div>
                  <p className="line-clamp-5 text-sm leading-7 text-white/70">{draft.description || "Sinopse editorial aparece aqui."}</p>
                </div>
              </div>
            ) : null}

            {previewTab === "mobile" ? (
              <div className="mx-auto w-[250px] p-4">
                <div className="overflow-hidden rounded-[26px] border border-white/12 bg-[#030609] shadow-[0_18px_60px_rgba(0,0,0,.5)]">
                  <div className="relative aspect-[9/16]">
                    <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-92" src={backdropPreview ?? posterPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&h=1600&q=86"} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.06)_0%,rgba(3,6,9,.22)_50%,#030609_100%)]" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Mobile</p>
                      <p className="mt-1 truncate text-base font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                      <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-white/68">{draft.description || "Sinopse aparece aqui."}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {previewTab === "tv" ? (
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase text-white/45">TV</p>
                <div className="mt-3 overflow-hidden rounded-md border border-white/10">
                  <div className="relative aspect-[16/7]">
                    <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={backdropPreview ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&h=800&q=86"} />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.92)_40%,rgba(3,6,9,.22)_78%,rgba(3,6,9,.65)_100%)]" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-2xl font-semibold text-white">{draft.title || "Titulo do filme"}</p>
                      <p className="mt-2 text-sm text-white/70">{draft.genre || "Sem genero"} {draft.releaseYear ? `/ ${draft.releaseYear}` : ""}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Qualidade</h2>
            <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", scoreTone(qualityScore))}>{qualityScore}%</span>
          </div>
          <div className="mt-4 grid gap-2">
            {(
              [
                { label: "Poster", ok: checks.poster },
                { label: "Backdrop", ok: checks.backdrop },
                { label: "Sinopse", ok: checks.synopsis },
                { label: "Trailer / Video / Mux", ok: checks.trailer },
                { label: "Classificacao", ok: checks.rating },
                { label: "Genero", ok: checks.genres },
                { label: "SEO", ok: checks.seo },
              ] as const
            ).map(({ label, ok }) => (
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3 text-sm" key={label}>
                <span className="text-white/70">{label}</span>
                {ok ? <CheckCircle2 className="text-emerald-200" size={16} /> : <XCircle className="text-rose-200" size={16} />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Assistente Editorial</h2>
            <span className="text-xs text-cinema-cyan">avisos</span>
          </div>
          {warnings.length ? (
            <div className="mt-4 space-y-2">
              {warnings.slice(0, 8).map((item) => (
                <div className="flex items-start gap-3 rounded-md border border-amber-300/18 bg-amber-300/[0.055] px-3 py-3 text-sm text-white/80" key={item}>
                  <ImageIcon className="mt-0.5 shrink-0 text-amber-100" size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-emerald-300/18 bg-emerald-300/[0.035] px-4 py-3 text-sm text-emerald-100">
              Conteudo pronto para curadoria e destaque.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.055] text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/admin/content/movies">
              <Film size={16} />
              Voltar
            </Link>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" onClick={() => setStep("publish")} type="button">
              <CheckCircle2 size={16} />
              Finalizar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
