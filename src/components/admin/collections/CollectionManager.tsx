"use client";

import { Archive, Copy, Plus, Search, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  archiveCollectionAction,
  createCollectionAction,
  deleteCollectionAction,
  duplicateCollectionAction,
  publishCollectionAction,
  unpublishCollectionAction,
} from "@/app/admin/actions";
import type { Collection } from "@/types/domain";
import { cn } from "@/utils/cn";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value?: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusTone(status: Collection["status"]) {
  if (status === "published") return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100";
  if (status === "archived") return "border-white/10 bg-white/[0.03] text-white/55";
  if (status === "scheduled") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/70";
}

export function CollectionManager({
  collections,
  error,
}: {
  collections: Collection[];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return collections;
    return collections.filter((c) => normalize(`${c.title} ${c.slug} ${c.description} ${c.shortDescription}`).includes(q));
  }, [collections, query]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Curadoria</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Colecoes editoriais</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Vitrines do MaxCinema conectadas com Home/Browse. Sem duplicacao de listas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]"
                onClick={() => setShowCreate(true)}
                type="button"
              >
                <Plus size={16} />
                Nova colecao
              </button>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/admin/home-editor">
                Home Editor
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <label className="mt-5 flex h-11 items-center gap-3 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/55 transition focus-within:border-cinema-cyan/50">
            <Search size={17} />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar colecoes por titulo, slug, descricao"
              value={query}
            />
            <span className="text-xs text-white/35">{filtered.length}/{collections.length}</span>
          </label>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((collection) => {
            const cover =
              collection.coverUrl ||
              collection.bannerUrl ||
              "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&h=900&q=86";
            return (
              <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:border-white/18 hover:bg-white/[0.055]" key={collection.id}>
                <Link href={`/admin/collections/${collection.id}/edit`}>
                  <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.035]">
                    <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-88" src={cover} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/12 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/14 bg-black/40 px-3 py-1 text-xs font-semibold text-white/82 backdrop-blur">
                      <span className="size-2 rounded-full" style={{ backgroundColor: collection.accentColor }} />
                      {collection.type.replace(/_/g, " ")}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-white">{collection.title}</h3>
                        <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", statusTone(collection.status))}>
                          {collection.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/62">
                        {collection.shortDescription || collection.description || "Sem descricao"}
                      </p>
                      <p className="mt-3 text-xs text-white/42">Atualizado {formatDate(collection.updatedAt)}</p>
                    </div>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-2 border-t border-white/8 p-3 text-white/70">
                  {collection.status !== "published" ? (
                    <form action={publishCollectionAction.bind(null, collection.id)}>
                      <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
                        Publicar
                      </button>
                    </form>
                  ) : (
                    <form action={unpublishCollectionAction.bind(null, collection.id)}>
                      <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                        Despublicar
                      </button>
                    </form>
                  )}
                  <form action={duplicateCollectionAction.bind(null, collection.id)}>
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                      <Copy size={14} />
                      Duplicar
                    </button>
                  </form>
                  <form action={archiveCollectionAction.bind(null, collection.id)}>
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                      <Archive size={14} />
                      Arquivar
                    </button>
                  </form>
                  <form action={deleteCollectionAction.bind(null, collection.id)} onSubmit={(event) => {
                    if (!window.confirm("Excluir esta colecao? Use arquivar se quiser manter historico.")) event.preventDefault();
                  }}>
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-rose-200/90 hover:text-rose-100" type="submit">
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <aside className="space-y-4">
        {showCreate ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Nova colecao</h2>
              <button className="grid size-9 place-items-center rounded-md border border-white/10 text-white/60 hover:text-white" onClick={() => setShowCreate(false)} type="button">
                <Settings2 size={16} />
              </button>
            </div>
            <form action={createCollectionAction} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-white/55">
                Titulo
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="title" placeholder="Ex: Filmes para hoje a noite" required />
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Slug (opcional)
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="slug" placeholder="filmes-para-hoje-a-noite" />
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Descricao curta
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="shortDescription" placeholder="Uma frase editorial" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-white/55">
                  Tipo
                  <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="editorial" name="type">
                    <option value="editorial">editorial</option>
                    <option value="manual">manual</option>
                    <option value="top_10">top_10</option>
                    <option value="seasonal">seasonal</option>
                    <option value="dynamic">dynamic</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-white/55">
                  Cor
                  <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-1" defaultValue="#13c8ff" name="accentColor" type="color" />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                <input className="accent-cinema-cyan" defaultChecked name="isFeatured" type="checkbox" />
                destaque editorial
              </label>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" type="submit">
                <Plus size={16} />
                Criar colecao
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Studio</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Colecoes alimentam rails e vitrines sem duplicar listas. Crie uma colecao e conecte em uma Home Section com fonte &quot;collection&quot;.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link className="inline-flex h-11 items-center justify-center rounded-md border border-white/12 bg-white/[0.055] text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/browse/collections">
                Ver no Browse
              </Link>
              <button className="inline-flex h-11 items-center justify-center rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" onClick={() => setShowCreate(true)} type="button">
                Nova colecao
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
