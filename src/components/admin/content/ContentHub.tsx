"use client";

import {
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  Grid3X3,
  LayoutList,
  List,
  PanelRightOpen,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  bulkDeleteMoviesAction,
  bulkFeatureMoviesAction,
  bulkPublishMoviesAction,
  bulkUnpublishMoviesAction,
  deleteMovieAction,
  duplicateMovieAction,
  publishMovieAction,
  toggleFeaturedMovieAction,
  unpublishMovieAction,
} from "@/app/admin/actions";
import { ContentStatusBadge } from "@/components/admin/shared/ContentStatusBadge";
import type { AdminContentIndexItem, AdminContentIssue } from "@/services/admin/admin-content-index-service";
import { cn } from "@/utils/cn";

type ViewMode = "grid" | "table" | "editorial" | "compact";

type ContentFilters = {
  query: string;
  type: "all" | "movie" | "series";
  status: "all" | "published" | "draft";
  featured: "all" | "featured" | "not_featured";
  original: "all" | "original" | "not_original";
  hero: "all" | "hero" | "not_hero";
  health: "all" | "green" | "amber" | "red";
  missing: Partial<Record<AdminContentIssue, boolean>>;
  sort: "updated_desc" | "created_desc" | "title_asc" | "year_desc" | "favorites_desc" | "views_desc";
};

const missingOptions: Array<{ key: AdminContentIssue; label: string }> = [
  { key: "poster", label: "Sem poster" },
  { key: "backdrop", label: "Sem backdrop" },
  { key: "trailer", label: "Sem trailer" },
  { key: "description", label: "Sem descricao" },
  { key: "genre", label: "Sem genero" },
  { key: "duration", label: "Sem duracao" },
  { key: "rating", label: "Sem classificacao" },
  { key: "slug", label: "Sem slug" },
];

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function healthTone(health: ContentFilters["health"] | AdminContentIndexItem["health"]) {
  if (health === "green") return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-200";
  if (health === "amber") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  if (health === "red") return "border-rose-300/18 bg-rose-300/[0.055] text-rose-100";
  return "border-white/10 bg-white/[0.04] text-white/62";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Bom";
  if (score >= 55) return "Parcial";
  return "Critico";
}

export function ContentHub({ items }: { items: AdminContentIndexItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => readLocal<ViewMode>("maxcinema.content.view", "grid"));
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.movie.id ?? null);
  const [filters, setFilters] = useState<ContentFilters>(() => {
    const defaults: ContentFilters = {
      query: "",
      type: "all",
      status: "all",
      featured: "all",
      original: "all",
      hero: "all",
      health: "all",
      missing: {},
      sort: "updated_desc",
    };

    return readLocal<ContentFilters>("maxcinema.content.filters", defaults);
  });

  useEffect(() => {
    writeLocal("maxcinema.content.view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    writeLocal("maxcinema.content.filters", filters);
  }, [filters]);

  const indexed = useMemo(() => {
    const byId = new Map(items.map((item) => [item.movie.id, item]));
    return { byId };
  }, [items]);

  const filtered = useMemo(() => {
    const query = normalize(filters.query.trim());
    const requiredMissing = Object.entries(filters.missing)
      .filter(([, enabled]) => enabled)
      .map(([issue]) => issue as AdminContentIssue);

    const matchesQuery = (item: AdminContentIndexItem) => {
      if (!query) return true;
      const title = normalize(item.movie.title);
      const slug = normalize(item.movie.slug);
      const description = normalize(item.movie.description ?? "");
      const genres = normalize(item.movie.genres.map((genre) => genre.name).join(" "));
      const year = String(item.movie.releaseYear ?? "");
      return `${title} ${slug} ${description} ${genres} ${year}`.includes(query);
    };

    const result = items
      .filter((item) => (filters.type === "all" ? true : item.movie.type === filters.type))
      .filter((item) => (filters.status === "all" ? true : item.movie.status === filters.status))
      .filter((item) => (filters.featured === "all" ? true : filters.featured === "featured" ? item.movie.featured : !item.movie.featured))
      .filter((item) => (filters.original === "all" ? true : filters.original === "original" ? item.movie.genres.some((g) => g.slug === "original") : !item.movie.genres.some((g) => g.slug === "original")))
      .filter((item) => (filters.hero === "all" ? true : filters.hero === "hero" ? item.appearsIn.hero : !item.appearsIn.hero))
      .filter((item) => (filters.health === "all" ? true : item.health === filters.health))
      .filter((item) => (requiredMissing.length ? requiredMissing.every((issue) => item.issues.includes(issue)) : true))
      .filter(matchesQuery);

    const sorters: Record<ContentFilters["sort"], (a: AdminContentIndexItem, b: AdminContentIndexItem) => number> = {
      updated_desc: (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
      created_desc: (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      title_asc: (a, b) => a.movie.title.localeCompare(b.movie.title),
      year_desc: (a, b) => (b.movie.releaseYear ?? 0) - (a.movie.releaseYear ?? 0),
      favorites_desc: (a, b) => b.favoriteCount - a.favoriteCount,
      views_desc: (a, b) => b.viewCount - a.viewCount,
    };

    return [...result].sort(sorters[filters.sort]);
  }, [filters, items]);

  const effectiveActiveId = activeId && indexed.byId.has(activeId) ? activeId : filtered[0]?.movie.id ?? null;
  const active = effectiveActiveId ? indexed.byId.get(effectiveActiveId) : null;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Conteudos</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Central editorial</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Gerencie o catalogo como streaming: qualidade, curadoria, presenca na Home, performance e edicao rapida.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]" href="/admin/content/new">
                Novo filme
              </Link>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/admin/media">
                Upload de midia
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/55 transition focus-within:border-cinema-cyan/50">
              <Search size={17} />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Buscar por titulo, slug, descricao, ano, categoria"
                value={filters.query}
              />
              <span className="text-xs text-white/35">{filtered.length}/{items.length}</span>
            </label>

            <button
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
                showFilters ? "border-cinema-cyan/40 bg-cinema-cyan/10 text-white" : "border-white/10 bg-white/[0.035] text-white/66 hover:text-white",
              )}
              onClick={() => setShowFilters((current) => !current)}
              type="button"
            >
              <Filter size={16} />
              Filtros
            </button>

            <div className="grid grid-cols-4 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
              {([
                ["grid", Grid3X3, "Grid"],
                ["table", LayoutList, "Tabela"],
                ["editorial", PanelRightOpen, "Editorial"],
                ["compact", List, "Compacto"],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 text-xs font-semibold transition",
                    viewMode === mode ? "bg-cinema-cyan text-slate-950" : "text-white/64 hover:bg-white/8 hover:text-white",
                  )}
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  type="button"
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedIds.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-white/62">
                <span className="font-semibold text-white">{selectedIds.length}</span> selecionados
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={bulkPublishMoviesAction}>
                  <input name="ids" type="hidden" value={JSON.stringify(selectedIds)} />
                  <input name="redirectTo" type="hidden" value="/admin/content" />
                  <button className="inline-flex h-9 items-center gap-2 rounded-md bg-cinema-cyan px-3 text-xs font-semibold text-slate-950" type="submit">
                    <CheckCircle2 size={14} />
                    Publicar
                  </button>
                </form>
                <form action={bulkUnpublishMoviesAction}>
                  <input name="ids" type="hidden" value={JSON.stringify(selectedIds)} />
                  <input name="redirectTo" type="hidden" value="/admin/content" />
                  <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                    Despublicar
                  </button>
                </form>
                <form action={bulkFeatureMoviesAction}>
                  <input name="ids" type="hidden" value={JSON.stringify(selectedIds)} />
                  <input name="featured" type="hidden" value="true" />
                  <input name="redirectTo" type="hidden" value="/admin/content" />
                  <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                    <Star size={14} />
                    Marcar destaque
                  </button>
                </form>
                <form action={bulkFeatureMoviesAction}>
                  <input name="ids" type="hidden" value={JSON.stringify(selectedIds)} />
                  <input name="featured" type="hidden" value="false" />
                  <input name="redirectTo" type="hidden" value="/admin/content" />
                  <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                    Remover destaque
                  </button>
                </form>
                <form action={bulkDeleteMoviesAction}>
                  <input name="ids" type="hidden" value={JSON.stringify(selectedIds)} />
                  <input name="redirectTo" type="hidden" value="/admin/content" />
                  <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-rose-200/90 hover:text-rose-100" type="submit">
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </form>
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:text-white"
                  onClick={clearSelection}
                  type="button"
                >
                  Limpar
                </button>
              </div>
            </div>
          ) : null}
        </header>

        {showFilters ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Tipo</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as ContentFilters["type"] }))}
                  value={filters.type}
                >
                  <option value="all">Todos</option>
                  <option value="movie">Filme</option>
                  <option value="series">Serie</option>
                </select>
              </label>
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Status</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ContentFilters["status"] }))}
                  value={filters.status}
                >
                  <option value="all">Todos</option>
                  <option value="published">Publicado</option>
                  <option value="draft">Rascunho</option>
                </select>
              </label>
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Destaque</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, featured: event.target.value as ContentFilters["featured"] }))}
                  value={filters.featured}
                >
                  <option value="all">Todos</option>
                  <option value="featured">Somente destaque</option>
                  <option value="not_featured">Sem destaque</option>
                </select>
              </label>
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Saude</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, health: event.target.value as ContentFilters["health"] }))}
                  value={filters.health}
                >
                  <option value="all">Todas</option>
                  <option value="green">Completo</option>
                  <option value="amber">Faltando info</option>
                  <option value="red">Critico</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Hero</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, hero: event.target.value as ContentFilters["hero"] }))}
                  value={filters.hero}
                >
                  <option value="all">Todos</option>
                  <option value="hero">Aparece no Hero</option>
                  <option value="not_hero">Nao esta no Hero</option>
                </select>
              </label>
              <label className="text-sm text-white/62">
                <span className="text-xs font-semibold uppercase text-white/40">Original</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, original: event.target.value as ContentFilters["original"] }))}
                  value={filters.original}
                >
                  <option value="all">Todos</option>
                  <option value="original">Original MaxCinema</option>
                  <option value="not_original">Nao original</option>
                </select>
              </label>
              <label className="text-sm text-white/62 md:col-span-2">
                <span className="text-xs font-semibold uppercase text-white/40">Ordenar</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                  onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ContentFilters["sort"] }))}
                  value={filters.sort}
                >
                  <option value="updated_desc">Atualizacao (desc)</option>
                  <option value="created_desc">Criacao (desc)</option>
                  <option value="title_asc">Titulo (A-Z)</option>
                  <option value="year_desc">Ano (desc)</option>
                  <option value="favorites_desc">Favoritos (desc)</option>
                  <option value="views_desc">Views (desc)</option>
                </select>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-white/40">Faltando</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {missingOptions.map((option) => (
                  <label className="flex items-center gap-3 rounded-md border border-white/8 bg-black/18 px-3 py-2 text-sm text-white/70" key={option.key}>
                    <input
                      checked={Boolean(filters.missing[option.key])}
                      className="size-4 accent-cinema-cyan"
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          missing: { ...current.missing, [option.key]: event.target.checked || undefined },
                        }))
                      }
                      type="checkbox"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="text-xs uppercase text-white/42">
                  <tr>
                    <th className="px-5 py-4">Sel</th>
                    <th className="px-5 py-4">Titulo</th>
                    <th className="px-5 py-4">Tipo</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Categorias</th>
                    <th className="px-5 py-4">Ano</th>
                    <th className="px-5 py-4">Atualizacao</th>
                    <th className="px-5 py-4">Saude</th>
                    <th className="px-5 py-4">Destaque</th>
                    <th className="px-5 py-4 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filtered.map((item) => (
                    <tr
                      className={cn("transition hover:bg-white/[0.045]", activeId === item.movie.id && "bg-white/[0.035]")}
                      key={item.movie.id}
                      onClick={() => setActiveId(item.movie.id)}
                    >
                      <td className="px-5 py-4">
                        <input
                          checked={selectedIds.includes(item.movie.id)}
                          className="size-4 accent-cinema-cyan"
                          onChange={() => toggleSelected(item.movie.id)}
                          onClick={(event) => event.stopPropagation()}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img alt="" className="size-12 rounded-md object-cover ring-1 ring-white/10" src={item.movie.posterUrl} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{item.movie.title}</p>
                            <p className="truncate text-xs text-cinema-muted">{item.movie.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70">{item.movie.type === "series" ? "Serie" : "Filme"}</td>
                      <td className="px-5 py-4">
                        <ContentStatusBadge status={item.movie.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-white/62">{item.movie.genres.map((genre) => genre.name).slice(0, 2).join(", ") || "—"}</td>
                      <td className="px-5 py-4 text-sm text-white/62">{item.movie.releaseYear || "—"}</td>
                      <td className="px-5 py-4 text-sm text-white/52">{formatDate(item.updatedAt ?? item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-semibold", healthTone(item.health))}>
                          {item.qualityScore}% {scoreLabel(item.qualityScore)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-cinema-amber">
                        <form action={toggleFeaturedMovieAction.bind(null, item.movie.id, !item.movie.featured)}>
                          <button className="grid size-9 place-items-center rounded-md border border-white/10 text-cinema-amber transition hover:bg-cinema-amber/10" title={item.movie.featured ? "Remover destaque" : "Marcar destaque"} type="submit">
                            {item.movie.featured ? <Star size={17} fill="currentColor" /> : <Star size={17} />}
                          </button>
                        </form>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2 text-white/55" onClick={(event) => event.stopPropagation()}>
                          <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/movie/${item.movie.slug}`} title="Ver pagina publica">
                            <Eye size={15} />
                          </Link>
                          <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/admin/content/${item.movie.id}/edit`} title="Editar">
                            <Pencil size={15} />
                          </Link>
                          <form action={duplicateMovieAction.bind(null, item.movie.id)}>
                            <button className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" title="Duplicar" type="submit">
                              <Copy size={15} />
                            </button>
                          </form>
                          <form action={deleteMovieAction.bind(null, item.movie.id)}>
                            <button className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-rose-200" title="Excluir" type="submit">
                              <Trash2 size={15} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "compact" ? (
            <div className="divide-y divide-white/8">
              {filtered.map((item) => (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.045]",
                    activeId === item.movie.id && "bg-white/[0.035]",
                  )}
                  key={item.movie.id}
                  onClick={() => setActiveId(item.movie.id)}
                  type="button"
                >
                  <input
                    checked={selectedIds.includes(item.movie.id)}
                    className="size-4 accent-cinema-cyan"
                    onChange={() => toggleSelected(item.movie.id)}
                    onClick={(event) => event.stopPropagation()}
                    type="checkbox"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{item.movie.title}</span>
                    <span className="mt-1 block truncate text-xs text-white/42">
                      {item.movie.type === "series" ? "Serie" : "Filme"} · {item.movie.status} · {item.movie.releaseYear} · {item.movie.genres[0]?.name ?? "Sem genero"}
                    </span>
                  </span>
                  <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", healthTone(item.health))}>{item.qualityScore}%</span>
                  <span className="text-xs text-white/42">{item.viewCount} views</span>
                </button>
              ))}
            </div>
          ) : viewMode === "editorial" ? (
            <div className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((item) => (
                <article
                  className={cn(
                    "group overflow-hidden rounded-lg border border-white/10 bg-black/18 transition hover:border-white/20 hover:bg-white/[0.045]",
                    activeId === item.movie.id && "border-cinema-cyan/35",
                  )}
                  key={item.movie.id}
                >
                  <button className="block w-full text-left" onClick={() => setActiveId(item.movie.id)} type="button">
                    <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.035]">
                      <img alt="" className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105" src={item.movie.backdropUrl} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/20 to-transparent" />
                      <div className="absolute left-3 top-3">
                        <ContentStatusBadge status={item.movie.status} />
                      </div>
                      <div className="absolute right-3 top-3">
                        <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", healthTone(item.health))}>{item.qualityScore}%</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="truncate text-base font-semibold text-white">{item.movie.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/62">{item.movie.description}</p>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 p-3">
                    <label className="flex items-center gap-2 text-xs text-white/55">
                      <input
                        checked={selectedIds.includes(item.movie.id)}
                        className="size-4 accent-cinema-cyan"
                        onChange={() => toggleSelected(item.movie.id)}
                        type="checkbox"
                      />
                      Selecionar
                    </label>
                    <div className="flex items-center gap-2 text-white/55">
                      <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/movie/${item.movie.slug}`} title="Ver pagina publica">
                        <Eye size={15} />
                      </Link>
                      <Link className="grid size-9 place-items-center rounded-md border border-white/10 hover:text-white" href={`/admin/content/${item.movie.id}/edit`} title="Editar">
                        <Pencil size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((item) => (
                <article
                  className={cn(
                    "group overflow-hidden rounded-lg border border-white/10 bg-black/18 transition hover:border-white/20 hover:bg-white/[0.045]",
                    activeId === item.movie.id && "border-cinema-cyan/35",
                  )}
                  key={item.movie.id}
                >
                  <button className="block w-full text-left" onClick={() => setActiveId(item.movie.id)} type="button">
                    <div className="relative aspect-[3/4] overflow-hidden bg-white/[0.035]">
                      <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-88 transition duration-500 group-hover:scale-105" src={item.movie.posterUrl} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-transparent" />
                      <div className="absolute left-3 top-3">
                        <ContentStatusBadge status={item.movie.status} />
                      </div>
                      <div className="absolute right-3 top-3">
                        <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", healthTone(item.health))}>{item.qualityScore}%</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs text-cinema-amber">{item.movie.rating ? item.movie.rating.toFixed(1) : "—"}</p>
                        <h3 className="truncate text-sm font-semibold text-white">{item.movie.title}</h3>
                        <p className="mt-1 text-xs text-white/52">
                          {item.movie.releaseYear || "—"} · {item.movie.durationMinutes ? `${item.movie.durationMinutes}m` : "—"} · {item.movie.genres[0]?.name ?? "Sem genero"}
                        </p>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 p-3">
                    <label className="flex items-center gap-2 text-xs text-white/55">
                      <input checked={selectedIds.includes(item.movie.id)} className="size-4 accent-cinema-cyan" onChange={() => toggleSelected(item.movie.id)} type="checkbox" />
                      Selecionar
                    </label>
                    <form action={toggleFeaturedMovieAction.bind(null, item.movie.id, !item.movie.featured)}>
                      <button className="grid size-9 place-items-center rounded-md border border-white/10 text-cinema-amber transition hover:bg-cinema-amber/10" title={item.movie.featured ? "Remover destaque" : "Marcar destaque"} type="submit">
                        {item.movie.featured ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <aside className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Detalhes</h2>
          <span className="text-xs text-cinema-cyan">painel lateral</span>
        </div>

        {active ? (
          <div className="mt-5 space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/22">
              <img alt="" className="aspect-[2/3] w-full object-cover" src={active.movie.posterUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-xs text-white/60">{active.movie.type === "series" ? "Serie" : "Filme"}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{active.movie.title}</h3>
                <p className="mt-1 text-xs text-white/58">
                  {active.movie.releaseYear || "—"} · {active.movie.durationMinutes ? `${active.movie.durationMinutes}m` : "—"} · {active.movie.genres[0]?.name ?? "Sem genero"}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3">
                <span className="text-xs text-white/48">Status</span>
                <span className="text-xs font-semibold text-white/80">{active.movie.status}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3">
                <span className="text-xs text-white/48">Qualidade</span>
                <span className={cn("text-xs font-semibold", active.health === "green" ? "text-emerald-200" : active.health === "amber" ? "text-amber-100" : "text-rose-100")}>
                  {active.qualityScore}% · {scoreLabel(active.qualityScore)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3">
                <span className="text-xs text-white/48">Views</span>
                <span className="text-xs font-semibold text-white/80">{active.viewCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3">
                <span className="text-xs text-white/48">Favoritos</span>
                <span className="text-xs font-semibold text-white/80">{active.favoriteCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 px-3 py-3">
                <span className="text-xs text-white/48">Conclusao</span>
                <span className="text-xs font-semibold text-white/80">{active.completionRate}%</span>
              </div>
            </div>

            <div className="rounded-md border border-white/8 bg-black/18 p-3">
              <p className="text-xs font-semibold uppercase text-white/42">Aparece no Browse</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className={cn("rounded-full border px-2 py-1 font-semibold", active.appearsIn.hero ? "border-cinema-cyan/35 bg-cinema-cyan/10 text-white" : "border-white/10 text-white/55")}>
                  Hero
                </span>
                {active.appearsIn.sections.slice(0, 4).map((section) => (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-white/62" key={section}>
                    {section}
                  </span>
                ))}
                {!active.appearsIn.hero && active.appearsIn.sections.length === 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-white/55">Nao esta na Home</span>
                ) : null}
              </div>
            </div>

            {active.issues.length ? (
              <div className="rounded-md border border-amber-300/18 bg-amber-300/[0.055] p-3">
                <p className="text-xs font-semibold uppercase text-white/42">Pendencias</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {active.issues.map((issue) => (
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-white/70" key={issue}>
                      {missingOptions.find((item) => item.key === issue)?.label ?? issue}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-300/18 bg-emerald-300/[0.035] p-3 text-sm text-emerald-100">
                Conteudo completo. Pronto para destaque e recomendacao.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" href={`/admin/content/${active.movie.id}/edit`}>
                <Pencil size={16} />
                Editar
              </Link>
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.055] text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href={`/movie/${active.movie.slug}`}>
                <Eye size={16} />
                Ver
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <form action={active.movie.status === "published" ? unpublishMovieAction.bind(null, active.movie.id) : publishMovieAction.bind(null, active.movie.id)}>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                  <CheckCircle2 size={14} />
                  {active.movie.status === "published" ? "Despublicar" : "Publicar"}
                </button>
              </form>
              <form action={duplicateMovieAction.bind(null, active.movie.id)}>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                  <Copy size={14} />
                  Duplicar
                </button>
              </form>
              <form action={toggleFeaturedMovieAction.bind(null, active.movie.id, !active.movie.featured)}>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                  <Star size={14} />
                  {active.movie.featured ? "Remover destaque" : "Marcar destaque"}
                </button>
              </form>
              <form action={deleteMovieAction.bind(null, active.movie.id)}>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-rose-200/90 hover:text-rose-100" type="submit">
                  <Trash2 size={14} />
                  Excluir
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-white/45">Selecione um conteudo para ver detalhes, saude e presenca no Browse.</p>
        )}
      </aside>
    </div>
  );
}
