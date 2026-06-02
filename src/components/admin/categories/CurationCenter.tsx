"use client";

import { GripVertical, List, LayoutGrid, LayoutTemplate, MonitorPlay, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import type { AdminCurationIndex, AdminCurationGenre, AdminCurationViewHint } from "@/services/admin/admin-curation-service";
import { cn } from "@/utils/cn";

type ViewMode = AdminCurationViewHint;

function formatDate(value?: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function viewIcon(mode: ViewMode) {
  if (mode === "cards") return LayoutGrid;
  if (mode === "list") return List;
  if (mode === "editorial") return LayoutTemplate;
  return MonitorPlay;
}

export function CurationCenter({ index, error }: { index: AdminCurationIndex; error?: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [activeId, setActiveId] = useState<string | null>(index.items[0]?.genre.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>(() => index.items.map((item) => item.genre.id));

  const byId = useMemo(() => new Map(index.items.map((item) => [item.genre.id, item])), [index.items]);
  const orderedItems = useMemo(() => order.map((id) => byId.get(id)).filter((x): x is AdminCurationGenre => Boolean(x)), [order, byId]);

  const active = activeId ? byId.get(activeId) ?? null : null;

  const onDragStart = (id: string) => {
    setDragId(id);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrder((current) => {
      const next = [...current];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return current;
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  const hasReorderChanges = useMemo(() => {
    const original = index.items.map((i) => i.genre.id);
    return original.join("|") !== order.join("|");
  }, [index.items, order]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Centro de Curadoria</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Curadoria</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Categorias como secoes vivas: ordem, presenca na Home e preview de trilho. Reorganize por drag and drop.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]"
                onClick={() => setShowCreate(true)}
                type="button"
              >
                <Plus size={16} />
                Nova categoria
              </button>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/admin/home-editor">
                Home Editor
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Categorias", index.totals.genres],
              ["Ativas", index.totals.active],
              ["Inativas", index.totals.inactive],
              ["Vazias", index.totals.empty],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black/18 p-4" key={String(label)}>
                <p className="text-xs font-semibold uppercase text-white/38">{String(label)}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{String(value)}</p>
                <p className="mt-1 text-xs text-white/42">Atualizado {formatDate(index.updatedAt)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid grid-cols-4 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
              {(["cards", "list", "editorial", "browse"] as const).map((mode) => {
                const Icon = viewIcon(mode);
                const label = mode === "cards" ? "Cards" : mode === "list" ? "Lista" : mode === "editorial" ? "Curadoria" : "Browse";
                return (
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
                );
              })}
            </div>

            {hasReorderChanges ? (
              <div className="flex items-center justify-end gap-2 rounded-md border border-amber-300/18 bg-amber-300/[0.055] px-3 py-2 text-xs text-white/75">
                Ordem alterada. Aplique para refletir no Studio.
              </div>
            ) : null}
          </div>
        </header>

        <div className={cn(viewMode === "list" ? "rounded-xl border border-white/10 bg-white/[0.04]" : "")}>
          {viewMode === "list" ? (
            <div className="divide-y divide-white/8">
              {orderedItems.map((item) => (
                <button
                  className={cn(
                    "flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.045]",
                    activeId === item.genre.id && "bg-white/[0.035]",
                  )}
                  draggable
                  key={item.genre.id}
                  onClick={() => setActiveId(item.genre.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragStart={() => onDragStart(item.genre.id)}
                  onDrop={() => onDrop(item.genre.id)}
                  type="button"
                >
                  <GripVertical className="text-white/30" size={16} />
                  <span className="size-3 rounded-full" style={{ backgroundColor: item.genre.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{item.genre.name}</span>
                    <span className="mt-1 block truncate text-xs text-white/42">
                      {item.genre.slug} · #{item.genre.sortOrder} · {item.genre.active ? "ativa" : "inativa"} · {item.movieCount} filmes · {item.seriesCount} series
                    </span>
                  </span>
                  <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", item.homeUsage.inHome ? "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100" : "border-amber-300/18 bg-amber-300/[0.055] text-amber-100")}>
                    {item.homeUsage.inHome ? "Home" : "Fora da Home"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {orderedItems.map((item) => (
                <article
                  className={cn(
                    "group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:border-white/18 hover:bg-white/[0.055]",
                    activeId === item.genre.id && "border-cinema-cyan/35",
                  )}
                  draggable
                  key={item.genre.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDragStart={() => onDragStart(item.genre.id)}
                  onDrop={() => onDrop(item.genre.id)}
                >
                  <button className="block w-full text-left" onClick={() => setActiveId(item.genre.id)} type="button">
                    <div className="border-b border-white/8 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-black/18 text-sm font-semibold text-white/80" style={{ borderColor: `${item.genre.color}40` }}>
                            {item.genre.icon?.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase text-white/38">Categoria</p>
                            <h3 className="mt-1 text-lg font-semibold text-white">{item.genre.name}</h3>
                            <p className="mt-1 text-xs text-white/45">{item.genre.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/45">
                          <GripVertical size={16} />
                          <span className="text-xs">#{item.genre.sortOrder}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className={cn("rounded-full border px-2 py-1 font-semibold", item.genre.active ? "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100" : "border-white/10 bg-white/[0.03] text-white/55")}>
                          {item.genre.active ? "Ativa" : "Inativa"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/62">
                          {item.movieCount} filmes
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/62">
                          {item.seriesCount} series
                        </span>
                        <span className={cn("rounded-full border px-2 py-1 font-semibold", item.homeUsage.inHome ? "border-cinema-cyan/30 bg-cinema-cyan/10 text-white/85" : "border-amber-300/18 bg-amber-300/[0.055] text-amber-100")}>
                          {item.homeUsage.inHome ? "Home" : "Fora da Home"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase text-white/42">Preview</p>
                      {item.preview.length ? (
                        <div className="mt-3 flex gap-2 overflow-hidden">
                          {item.preview.slice(0, viewMode === "editorial" ? 5 : 6).map((movie) => (
                            <img
                              alt=""
                              className={cn(
                                "aspect-[2/3] shrink-0 rounded-md border border-white/10 object-cover",
                                viewMode === "browse" ? "w-20" : "w-16",
                              )}
                              key={movie.id}
                              src={movie.posterUrl}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm text-white/45">
                          Sem conteudos vinculados.
                        </div>
                      )}
                      <p className="mt-3 text-xs text-white/42">Atualizado {formatDate(item.updatedAt)}</p>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Detalhes</h2>
            <span className="text-xs text-cinema-cyan">curadoria</span>
          </div>

          {active ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="size-4 rounded-full shadow-[0_0_20px_currentColor]" style={{ backgroundColor: active.genre.color, color: active.genre.color }} />
                    <div>
                      <p className="text-xs font-semibold uppercase text-white/38">Categoria</p>
                      <p className="mt-1 text-lg font-semibold text-white">{active.genre.name}</p>
                      <p className="mt-1 text-xs text-white/45">{active.genre.slug}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/48">#{active.genre.sortOrder}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3 text-sm">
                    <p className="text-xs text-white/45">Filmes</p>
                    <p className="mt-1 font-semibold text-white">{active.movieCount}</p>
                  </div>
                  <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3 text-sm">
                    <p className="text-xs text-white/45">Series</p>
                    <p className="mt-1 font-semibold text-white">{active.seriesCount}</p>
                  </div>
                </div>

                {active.warnings.length ? (
                  <div className="mt-4 rounded-md border border-amber-300/18 bg-amber-300/[0.055] p-3">
                    <p className="text-xs font-semibold uppercase text-white/42">Avisos</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {active.warnings.slice(0, 6).map((warning) => (
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-white/70" key={warning}>
                          {warning}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-emerald-300/18 bg-emerald-300/[0.035] p-3 text-sm text-emerald-100">
                    Categoria saudavel. Pronta para trilhos e recomendacao.
                  </div>
                )}
              </div>

              <form action={updateCategoryAction.bind(null, active.genre.id)} className="rounded-lg border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase text-white/42">Editar</p>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs font-semibold text-white/55">
                    Nome
                    <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={active.genre.name} name="name" />
                  </label>
                  <label className="text-xs font-semibold text-white/55">
                    Slug
                    <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={active.genre.slug} name="slug" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="text-xs font-semibold text-white/55">
                      Icone
                      <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={active.genre.icon} name="icon" />
                    </label>
                    <label className="text-xs font-semibold text-white/55">
                      Cor
                      <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-1" defaultValue={active.genre.color} name="color" type="color" />
                    </label>
                    <label className="text-xs font-semibold text-white/55">
                      Posicao
                      <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={active.genre.sortOrder} name="sortOrder" type="number" />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                    <input className="accent-cinema-cyan" defaultChecked={active.genre.active} name="active" type="checkbox" />
                    ativa no Browse/Studio
                  </label>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-3 text-xs font-semibold text-slate-950" type="submit">
                    <Save size={14} />
                    Salvar
                  </button>
                  <button formAction={deleteCategoryAction.bind(null, active.genre.id)} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 text-xs font-semibold text-rose-200/90 hover:text-rose-100" type="submit">
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </form>

              <div className="rounded-lg border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase text-white/42">Trilhos na Home</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.homeUsage.rails.length ? (
                    active.homeUsage.rails.slice(0, 8).map((rail) => (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/62" key={rail}>
                        {rail}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/55">Nenhum</span>
                  )}
                </div>
                <p className="mt-3 text-xs text-white/42">Para controlar trilhos, use o Home Editor.</p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-white/45">Selecione uma categoria para ver preview, avisos e edicao.</p>
          )}
        </div>

        {showCreate ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Nova categoria</h2>
              <button className="grid size-9 place-items-center rounded-md border border-white/10 text-white/60 hover:text-white" onClick={() => setShowCreate(false)} type="button">
                <X size={16} />
              </button>
            </div>
            <form action={createCategoryAction} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-white/55">
                Nome
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="name" placeholder="Ex: Acao" required />
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Slug (opcional)
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="slug" placeholder="acao" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-white/55">
                  Icone
                  <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue="film" name="icon" />
                </label>
                <label className="block text-xs font-semibold text-white/55">
                  Cor
                  <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-1" defaultValue="#13c8ff" name="color" type="color" />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                <input className="accent-cinema-cyan" defaultChecked name="active" type="checkbox" />
                ativa
              </label>
              <input name="sortOrder" type="hidden" value={String(index.totals.genres)} />
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" type="submit">
                <Plus size={16} />
                Criar categoria
              </button>
            </form>
          </div>
        ) : null}

        {hasReorderChanges ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Ordem</h2>
              <span className="text-xs text-white/42">drag and drop</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/50">
              A ordem e usada como base editorial (sort_order). Salve para refletir no Studio e em listas que respeitam essa ordem.
            </p>
            <form action={reorderCategoriesAction} className="mt-4">
              <input name="order" type="hidden" value={JSON.stringify(order)} />
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
                <Save size={14} />
                Salvar ordem
              </button>
            </form>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
