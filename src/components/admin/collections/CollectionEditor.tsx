"use client";

import { Archive, CheckCircle2, Copy, GripVertical, Plus, Save, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  addCollectionItemAction,
  archiveCollectionAction,
  deleteCollectionAction,
  duplicateCollectionAction,
  publishCollectionAction,
  removeCollectionItemAction,
  reorderCollectionItemsAction,
  unpublishCollectionAction,
  uploadCollectionAssetAction,
  updateCollectionAction,
} from "@/app/admin/actions";
import type { Collection, CollectionItem, Movie } from "@/types/domain";
import { cn } from "@/utils/cn";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusTone(status: Collection["status"]) {
  if (status === "published") return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100";
  if (status === "archived") return "border-white/10 bg-white/[0.03] text-white/55";
  if (status === "scheduled") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/70";
}

function collectionQuality(collection: Collection, items: CollectionItem[]) {
  const score =
    (collection.bannerUrl ? 20 : 0) +
    (collection.coverUrl ? 20 : 0) +
    (collection.description ? 20 : 0) +
    (items.length >= 5 ? 20 : 0) +
    (collection.status === "published" ? 20 : 0);
  const label = score >= 90 ? "Excelente" : score >= 70 ? "Boa" : score >= 40 ? "Incompleta" : "Critica";
  return { score, label };
}

export function CollectionEditor({
  collection,
  items,
  catalog,
  error,
}: {
  collection: Collection;
  items: CollectionItem[];
  catalog: Movie[];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.id));
  const [renderedAt] = useState(() => Date.now());

  const byItemId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const orderedItems = useMemo(() => order.map((id) => byItemId.get(id)).filter((x): x is CollectionItem => Boolean(x)), [order, byItemId]);

  const filteredCatalog = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return catalog;
    return catalog.filter((m) => normalize(`${m.title} ${m.slug} ${m.description} ${m.releaseYear} ${m.genres.map((g) => g.name).join(" ")}`).includes(q));
  }, [catalog, query]);

  const hasReorderChanges = useMemo(() => items.map((i) => i.id).join("|") !== order.join("|"), [items, order]);
  const quality = useMemo(() => collectionQuality(collection, items), [collection, items]);
  const qualityAlerts = useMemo(() => {
    const unpublishedItems = items.filter((item) => item.movie.status !== "published").length;
    return [
      items.length === 0 ? "colecao vazia" : null,
      !collection.bannerUrl ? "sem banner" : null,
      !collection.coverUrl ? "sem capa" : null,
      collection.status === "draft" ? "rascunho" : null,
      collection.status === "scheduled" ? "agendada" : null,
      collection.endsAt && new Date(collection.endsAt).getTime() < renderedAt ? "expirada" : null,
      items.length > 0 && items.length < 5 ? "menos de 5 itens" : null,
      unpublishedItems ? `${unpublishedItems} itens nao publicados` : null,
    ].filter((alert): alert is string => Boolean(alert));
  }, [collection, items, renderedAt]);

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

  const cover =
    collection.coverUrl ||
    collection.bannerUrl ||
    orderedItems[0]?.movie.backdropUrl ||
    orderedItems[0]?.movie.posterUrl ||
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&h=900&q=86";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Colecao</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{collection.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{collection.shortDescription || collection.description || "Sem descricao"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full border px-3 py-2 text-xs font-semibold", statusTone(collection.status))}>{collection.status}</span>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/admin/collections">
                Voltar
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {collection.status !== "published" ? (
              <form action={publishCollectionAction.bind(null, collection.id)}>
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]" type="submit">
                  <CheckCircle2 size={16} />
                  Publicar
                </button>
              </form>
            ) : (
              <form action={unpublishCollectionAction.bind(null, collection.id)}>
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" type="submit">
                  Despublicar
                </button>
              </form>
            )}
            <form action={duplicateCollectionAction.bind(null, collection.id)}>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" type="submit">
                <Copy size={16} />
                Duplicar
              </button>
            </form>
            <form action={archiveCollectionAction.bind(null, collection.id)}>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" type="submit">
                <Archive size={16} />
                Arquivar
              </button>
            </form>
            <form action={deleteCollectionAction.bind(null, collection.id)} onSubmit={(event) => {
              if (!window.confirm("Excluir esta colecao? Os vinculos com Home Sections ficarao quebrados.")) event.preventDefault();
            }}>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-rose-200/90 hover:bg-white/10 hover:text-rose-100" type="submit">
                <Trash2 size={16} />
                Excluir
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Builder</h2>
            {hasReorderChanges ? (
              <form action={reorderCollectionItemsAction.bind(null, collection.id)}>
                <input name="order" type="hidden" value={JSON.stringify(order)} />
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-3 text-xs font-semibold text-slate-950" type="submit">
                  <Save size={14} />
                  Salvar ordem
                </button>
              </form>
            ) : (
              <span className="text-xs text-white/42">{items.length} itens</span>
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-white/10 bg-black/18 p-4">
              <p className="text-xs font-semibold uppercase text-white/42">Itens da colecao</p>
              {orderedItems.length ? (
                <div className="mt-3 space-y-2">
                  {orderedItems.map((item) => (
                    <div
                      className="grid grid-cols-[18px_44px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/16 p-2"
                      draggable
                      key={item.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDragStart={() => setDragId(item.id)}
                      onDrop={() => onDrop(item.id)}
                    >
                      <GripVertical className="text-white/30" size={16} />
                      <img alt="" className="size-10 rounded-md object-cover" src={item.movie.posterUrl} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{item.movie.title}</p>
                        <p className="text-xs text-white/42">{item.movie.type} · {item.movie.releaseYear}</p>
                      </div>
                      <form action={removeCollectionItemAction.bind(null, item.id)}>
                        <button className="grid size-9 place-items-center rounded-md border border-white/10 text-white/60 hover:text-rose-200" title="Remover" type="submit">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm text-white/45">
                  Colecao vazia. Busque um filme ao lado e adicione.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/18 p-4">
              <p className="text-xs font-semibold uppercase text-white/42">Buscar no catalogo</p>
              <label className="mt-3 flex h-11 items-center gap-3 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/55 transition focus-within:border-cinema-cyan/50">
                <Search size={17} />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por titulo, slug, genero, ano"
                  value={query}
                />
                <span className="text-xs text-white/35">{filteredCatalog.length}/{catalog.length}</span>
              </label>

              <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
                {filteredCatalog.slice(0, 40).map((movie) => (
                  <form action={addCollectionItemAction.bind(null, collection.id)} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/16 p-2" key={movie.id}>
                    <img alt="" className="size-10 rounded-md object-cover" src={movie.posterUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
                      <p className="text-xs text-white/42">{movie.releaseYear} · {movie.genres[0]?.name ?? "Sem genero"}</p>
                    </div>
                    <input name="movieId" type="hidden" value={movie.id} />
                    <input name="position" type="hidden" value={String(items.length)} />
                    <button className="grid size-9 place-items-center rounded-md border border-white/10 text-cinema-cyan hover:bg-cinema-cyan/10" title="Adicionar" type="submit">
                      <Plus size={15} />
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/42">MVP: mostra os 40 primeiros resultados por performance.</p>
            </div>
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Qualidade</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">{quality.label}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cinema-cyan" style={{ width: `${quality.score}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/45">{quality.score}/100</p>
          {qualityAlerts.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {qualityAlerts.map((alert) => (
                <span className="rounded-full border border-amber-300/18 bg-amber-300/[0.055] px-3 py-1 text-xs font-semibold text-amber-100/80" key={alert}>
                  {alert}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Detalhes</h2>
            <span className="text-xs text-cinema-cyan">editorial</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/22">
            <div className="relative aspect-[16/10]">
              <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={cover} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/12 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-xs text-white/58">{collection.type.replace(/_/g, " ")}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{collection.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/62">{collection.shortDescription || collection.description || "Sem descricao"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/18 p-4">
            <p className="text-xs font-semibold uppercase text-white/42">Midia</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <form action={uploadCollectionAssetAction.bind(null, collection.id, "banner")} className="rounded-md border border-dashed border-white/18 bg-white/5 p-4 text-sm text-white/60 transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
                <label className="block cursor-pointer">
                  <span className="block text-xs font-semibold uppercase text-white/45">Banner</span>
                  <span className="mt-2 block text-xs text-white/42">Recomendado 16:9 (hero/rail)</span>
                  <input accept="image/*" className="mt-3 block w-full text-xs text-white/65 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white/75 hover:file:bg-white/15" name="banner" type="file" />
                </label>
                <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
                  Salvar banner
                </button>
              </form>
              <form action={uploadCollectionAssetAction.bind(null, collection.id, "cover")} className="rounded-md border border-dashed border-white/18 bg-white/5 p-4 text-sm text-white/60 transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
                <label className="block cursor-pointer">
                  <span className="block text-xs font-semibold uppercase text-white/45">Capa</span>
                  <span className="mt-2 block text-xs text-white/42">Recomendado 16:9 (card)</span>
                  <input accept="image/*" className="mt-3 block w-full text-xs text-white/65 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white/75 hover:file:bg-white/15" name="cover" type="file" />
                </label>
                <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
                  Salvar capa
                </button>
              </form>
            </div>
          </div>

          <form action={updateCollectionAction.bind(null, collection.id)} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-white/55">
              Titulo
              <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={collection.title} name="title" />
            </label>
            <label className="block text-xs font-semibold text-white/55">
              Slug
              <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={collection.slug} name="slug" />
            </label>
            <label className="block text-xs font-semibold text-white/55">
              Descricao curta
              <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={collection.shortDescription} name="shortDescription" />
            </label>
            <label className="block text-xs font-semibold text-white/55">
              Descricao
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-black/22 px-3 py-2 text-sm text-white outline-none" defaultValue={collection.description} name="description" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-white/55">
                Tipo
                <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={collection.type} name="type">
                  <option value="editorial">editorial</option>
                  <option value="manual">manual</option>
                  <option value="top_10">top_10</option>
                  <option value="seasonal">seasonal</option>
                  <option value="dynamic">dynamic</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Visibilidade
                <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={collection.visibility} name="visibility">
                  <option value="public">public</option>
                  <option value="hidden">hidden</option>
                  <option value="members_only">members_only</option>
                  <option value="kids">kids</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-white/55">
                Cor
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-1" defaultValue={collection.accentColor} name="accentColor" type="color" />
              </label>
              <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                <input className="accent-cinema-cyan" defaultChecked={collection.isFeatured} name="isFeatured" type="checkbox" />
                destaque
              </label>
            </div>
            <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
              <Save size={14} />
              Salvar detalhes
            </button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link className="inline-flex h-11 items-center justify-center rounded-md border border-white/12 bg-white/[0.055] text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href={`/browse/collections/${collection.slug}`}>
              Ver no Browse
            </Link>
            <Link className="inline-flex h-11 items-center justify-center rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" href="/admin/home-editor">
              Conectar na Home
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
