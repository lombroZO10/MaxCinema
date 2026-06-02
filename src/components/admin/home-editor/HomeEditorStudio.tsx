"use client";

import {
  CheckCircle2,
  ChevronDown,
  Copy,
  GripVertical,
  LayoutGrid,
  Monitor,
  MonitorSmartphone,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addHomeSectionItemAction,
  createHomeSectionAction,
  deleteHomeSectionAction,
  removeHomeSectionItemAction,
  reorderHomeSectionItemsAction,
  reorderHomeSectionsAction,
  updateHomeSectionAction,
} from "@/app/admin/actions";
import { RECOMMENDATION_SECTION_OPTIONS } from "@/services/recommendation/recommendation-types";
import type { AdminHomeSection } from "@/services/admin-service";
import type { Collection, Movie } from "@/types/domain";
import { cn } from "@/utils/cn";

type PreviewDevice = "desktop" | "mobile" | "tv";

export type HomeEditorPreferences = {
  siteName: string;
  cardsPerSection: number;
  showCollections: boolean;
  showOriginals: boolean;
  showRecommendations: boolean;
  showContinueWatching: boolean;
  heroRotating: boolean;
  heroRotationMs: number;
  posterFallbackUrl: string;
  backdropFallbackUrl: string;
};

function formatRelative(value?: string) {
  if (!value) return "--";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function sourceLabel(section: AdminHomeSection) {
  const st = section.sourceType ?? "manual";
  if (st === "collection") return "Colecao";
  if (st === "recommendation") return "Intelligence";
  if (st === "dynamic") return "Automatica";
  return "Manual";
}

function typeLabel(type: string) {
  if (type === "hero") return "Hero";
  if (type === "collection") return "Colecao";
  return "Rail";
}

function sectionTone(section: AdminHomeSection) {
  if (!section.active) return "border-white/10 bg-white/[0.03] text-white/55";
  if ((section.sourceType ?? "manual") === "collection") return "border-cinema-cyan/25 bg-cinema-cyan/10 text-white/82";
  if (section.type === "hero") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
  return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100";
}

function pickHeroMovie(sections: AdminHomeSection[], fallback?: Movie) {
  const hero = sections.find((s) => s.type === "hero");
  const movie = hero?.items?.[0]?.movie ?? null;
  return movie ?? fallback ?? null;
}

export function HomeEditorStudio({
  movies,
  sections,
  collections,
  preferences,
  error,
}: {
  movies: Movie[];
  sections: AdminHomeSection[];
  collections: Collection[];
  preferences: HomeEditorPreferences;
  error?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => sections.map((s) => s.id));
  const [itemOrderBySection, setItemOrderBySection] = useState<Record<string, string[]>>(() => {
    const next: Record<string, string[]> = {};
    for (const section of sections) {
      next[section.id] = (section.items ?? []).map((i) => i.id);
    }
    return next;
  });

  useEffect(() => {
    // keep order arrays stable when server data changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSectionOrder((current) => {
      const ids = sections.map((s) => s.id);
      const keep = current.filter((id) => ids.includes(id));
      const missing = ids.filter((id) => !keep.includes(id));
      return [...keep, ...missing];
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItemOrderBySection((current) => {
      const next = { ...current };
      for (const section of sections) {
        const ids = (section.items ?? []).map((i) => i.id);
        const keep = (next[section.id] ?? []).filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !keep.includes(id));
        next[section.id] = [...keep, ...missing];
      }
      return next;
    });
  }, [sections]);

  const indexed = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const collectionsById = useMemo(() => new Map(collections.map((collection) => [collection.id, collection])), [collections]);
  const orderedSections = useMemo(() => sectionOrder.map((id) => indexed.get(id)).filter((s): s is AdminHomeSection => Boolean(s)), [sectionOrder, indexed]);

  const totals = useMemo(() => {
    const published = movies.filter((m) => m.status === "published").length;
    const featured = movies.filter((m) => m.featured).length;
    const activeRails = sections.filter((s) => s.active && s.type !== "hero").length;
    const latest = sections
      .map((section) => section.updatedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
    return {
      totalSections: sections.length,
      published,
      featured,
      activeRails,
      latestUpdatedAt: latest,
    };
  }, [movies, sections]);

  const hasSectionOrderChanges = useMemo(() => sections.map((s) => s.id).join("|") !== sectionOrder.join("|"), [sections, sectionOrder]);

  const onSectionDrop = (targetId: string) => {
    if (!dragSectionId || dragSectionId === targetId) return;
    setSectionOrder((current) => {
      const next = [...current];
      const from = next.indexOf(dragSectionId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return current;
      next.splice(from, 1);
      next.splice(to, 0, dragSectionId);
      return next;
    });
    setDragSectionId(null);
  };

  const heroMovie = pickHeroMovie(sections, movies[0]);
  const previewRails = orderedSections.filter((s) => s.active && s.type !== "hero").slice(0, 6);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Home Editor</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Central Editorial</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Programe a Home de {preferences.siteName}: secoes, origem, ordem e preview respeitando Sistema.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]" onClick={() => setShowCreate(true)} type="button">
                <LayoutGrid size={16} />
                Nova secao
              </button>
              <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/browse">
                Ver Home
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Secoes", totals.totalSections],
              ["Publicados", totals.published],
              ["Destaques", totals.featured],
              ["Trilhos ativos", totals.activeRails],
              ["Atualizado", totals.latestUpdatedAt ? `${formatRelative(totals.latestUpdatedAt)} atras` : "--"],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black/18 p-4" key={String(label)}>
                <p className="text-xs font-semibold uppercase text-white/38">{String(label)}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{String(value)}</p>
                <p className="mt-1 text-xs text-white/42">Studio</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Colecoes publicas", preferences.showCollections ? "ativas" : "ocultas"],
              ["Recomendacoes", preferences.showRecommendations ? "ativas" : "ocultas"],
              ["Continuar", preferences.showContinueWatching ? "ativo" : "oculto"],
              ["Hero rotativo", preferences.heroRotating ? `${preferences.heroRotationMs}ms` : "desativado"],
            ].map(([label, value]) => (
              <div className="rounded-md border border-white/10 bg-black/16 px-3 py-2" key={label}>
                <p className="text-[11px] font-semibold uppercase text-white/35">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white/72">{value}</p>
              </div>
            ))}
          </div>

          {!preferences.showCollections ? (
            <div className="mt-4 rounded-md border border-amber-300/18 bg-amber-300/[0.055] px-4 py-3 text-sm text-amber-100/82">
              Sistema esta com colecoes publicas ocultas. Secoes ligadas a colecoes continuam editaveis aqui, mas a area /browse/collections fica bloqueada para usuarios.
            </div>
          ) : null}

          {hasSectionOrderChanges ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-300/18 bg-amber-300/[0.055] px-4 py-3">
              <p className="text-sm text-white/75">Ordem das secoes alterada.</p>
              <form action={reorderHomeSectionsAction}>
                <input name="order" type="hidden" value={JSON.stringify(sectionOrder)} />
                <button className="inline-flex h-9 items-center gap-2 rounded-md bg-cinema-cyan px-3 text-xs font-semibold text-slate-950" type="submit">
                  <Save size={14} />
                  Salvar ordem
                </button>
              </form>
            </div>
          ) : null}
        </header>

        <section className="space-y-3">
          {orderedSections.map((section) => {
            const linkedCollection = section.sourceId ? collectionsById.get(section.sourceId) : undefined;
            const collectionArchived = section.sourceType === "collection" && section.collectionStatus === "archived";
            const collectionBroken = section.sourceType === "collection" && (!section.sourceId || !linkedCollection);

            return (
            <article
              className={cn(
                "overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:border-white/18 hover:bg-white/[0.055]",
                activeId === section.id && "border-cinema-cyan/35",
                (collectionArchived || collectionBroken) && "border-amber-300/25",
              )}
              draggable
              key={section.id}
              onDragOver={(e) => e.preventDefault()}
              onDragStart={() => setDragSectionId(section.id)}
              onDrop={() => onSectionDrop(section.id)}
            >
              <button className="block w-full text-left" onClick={() => setActiveId(section.id)} type="button">
                <div className="border-b border-white/8 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="text-white/30" size={18} />
                      <div>
                        <p className="text-xs font-semibold uppercase text-white/38">{typeLabel(section.type)}</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{section.title}</h3>
                        <p className="mt-1 text-xs text-white/45">{section.slug}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn("rounded-full border px-2 py-1 font-semibold", sectionTone(section))}>
                        {section.active ? "Ativa" : "Inativa"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/62">
                        {sourceLabel(section)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/62">
                        {section.itemCount} itens
                      </span>
                      {section.sourceType === "collection" && section.collectionStatus ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/55">
                          {section.collectionStatus}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/55">
                        pos {section.position}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {activeId === section.id ? (
                <div className="p-4">
                  <form action={updateHomeSectionAction.bind(null, section.id)} className="grid gap-3 md:grid-cols-[1fr_1fr_120px_90px]">
                    <input name="position" type="hidden" value={String(section.position)} />
                    <input className="h-11 rounded-md border border-white/10 bg-black/22 px-3 text-sm font-semibold text-white outline-none" defaultValue={section.title} name="title" />
                    <input className="h-11 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={section.slug} name="slug" />
                    <select className="h-11 rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={section.type} name="type">
                      <option value="rail">rail</option>
                      <option value="hero">hero</option>
                      <option value="collection">collection</option>
                    </select>
                    <label className="flex h-11 items-center justify-between gap-2 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/70">
                      <span>ativa</span>
                      <input className="accent-cinema-cyan" defaultChecked={section.active} name="active" type="checkbox" />
                    </label>

                    <label className="text-xs font-semibold text-white/55 md:col-span-2">
                      Fonte
                      <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={section.sourceType ?? "manual"} name="sourceType">
                        <option value="manual">manual</option>
                        <option value="collection">collection</option>
                        <option value="recommendation">recommendation</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-white/55 md:col-span-2">
                      Colecao (quando fonte=collection)
                      <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={section.sourceId ?? ""} name="sourceId">
                        <option value="">Selecionar colecao</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.status})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-white/55 md:col-span-2">
                      Intelligence (quando fonte=recommendation)
                      <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={section.sourceKey ?? "recommended_for_you"} name="sourceKey">
                        {RECOMMENDATION_SECTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-white/55 md:col-span-2">
                      Layout
                      <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={section.layoutVariant ?? "rail"} name="layoutVariant">
                        <option value="rail">rail</option>
                        <option value="poster_grid">poster_grid</option>
                        <option value="featured_banner">featured_banner</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-white/55">
                      Limite
                      <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={section.displayLimit ?? ""} min={1} name="displayLimit" placeholder={`${preferences.cardsPerSection} do Sistema`} type="number" />
                    </label>
                    <label className="flex h-11 items-center justify-between gap-2 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/70 md:mt-6">
                      <span>banner</span>
                      <input className="accent-cinema-cyan" defaultChecked={section.showCollectionBanner} name="showCollectionBanner" type="checkbox" />
                    </label>

                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950 md:col-span-4" type="submit">
                      <Save size={16} />
                      Salvar secao
                    </button>
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-sm font-semibold text-rose-200/90 hover:text-rose-100 md:col-span-4"
                      formAction={deleteHomeSectionAction.bind(null, section.id)}
                      type="submit"
                    >
                      <Trash2 size={16} />
                      Excluir secao
                    </button>
                  </form>

                  {(section.sourceType ?? "manual") === "manual" ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/18 p-4">
                      <p className="text-xs font-semibold uppercase text-white/42">Itens manuais</p>
                      <form action={addHomeSectionItemAction.bind(null, section.id)} className="mt-3 grid gap-2 md:grid-cols-[1fr_110px_auto]">
                        <select className="h-11 rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" name="movieId" required>
                          <option value="">Adicionar conteudo</option>
                          {movies.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                        </select>
                        <input className="h-11 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" defaultValue={section.itemCount} name="position" type="number" />
                        <button className="h-11 rounded-md border border-cinema-cyan/30 bg-cinema-cyan/10 px-4 text-sm font-semibold text-cinema-cyan hover:bg-cinema-cyan/15" type="submit">
                          Adicionar
                        </button>
                      </form>

                      <HomeSectionItemsList
                        itemIds={itemOrderBySection[section.id] ?? []}
                        items={section.items}
                        onReorder={(order) => setItemOrderBySection((c) => ({ ...c, [section.id]: order }))}
                        sectionId={section.id}
                      />
                    </div>
                  ) : section.sourceType === "collection" ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/18 p-4 text-sm text-white/55">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-white/42">Fonte unica</p>
                          <p className="mt-1 text-white/70">{section.collectionTitle ?? linkedCollection?.title ?? "Colecao nao selecionada"}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {section.itemCount} itens / {section.collectionStatus ?? "sem status"} / {section.collectionVisibility ?? linkedCollection?.visibility ?? "sem visibilidade"}
                          </p>
                        </div>
                        {section.sourceId ? (
                          <Link className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-white/70 hover:text-white" href={`/admin/collections/${section.sourceId}/edit`}>
                            Editar colecao
                          </Link>
                        ) : null}
                      </div>
                      {collectionArchived || collectionBroken ? (
                        <div className="mt-3 rounded-md border border-amber-300/18 bg-amber-300/[0.055] px-3 py-2 text-xs text-amber-100/80">
                          {collectionArchived ? "Colecao arquivada: permanece no historico admin, mas nao aparece publicamente." : "Secao quebrada: selecione uma colecao valida para publicar."}
                        </div>
                      ) : null}
                      {section.showCollectionBanner && (section.collectionBannerUrl || linkedCollection?.bannerUrl) ? (
                        <img alt="" className="mt-3 aspect-[16/5] w-full rounded-md object-cover" src={section.collectionBannerUrl ?? linkedCollection?.bannerUrl} />
                      ) : null}
                      <p className="mt-3 text-xs text-white/42">Os filmes sao lidos direto de collection_items. Nao ha copia em home_section_items.</p>
                    </div>
                  ) : null}
                  {section.sourceType === "recommendation" ? (
                    <div className="mt-4 rounded-lg border border-cinema-cyan/20 bg-cinema-cyan/[0.055] p-4 text-sm text-white/62">
                      <p className="text-xs font-semibold uppercase text-cinema-cyan">Intelligence Engine</p>
                      <p className="mt-2 text-white/72">
                        Esta secao e gerada pela recommendation engine. Ela respeita published, perfil ativo, favoritos, progresso, display_limit e anti-repeticao.
                      </p>
                      <p className="mt-2 text-xs text-white/45">Algoritmo: {section.sourceKey ?? "recommended_for_you"}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
          })}
        </section>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Preview da Home</h2>
            <span className="text-xs text-cinema-cyan">real-time</span>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
            {([
              ["desktop", Monitor, "Desktop"],
              ["mobile", MonitorSmartphone, "Mobile"],
              ["tv", LayoutGrid, "TV"],
            ] as const).map(([key, Icon, label]) => (
              <button
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 text-[11px] font-semibold transition",
                  device === key ? "bg-cinema-cyan text-slate-950" : "text-white/64 hover:bg-white/8 hover:text-white",
                )}
                key={key}
                onClick={() => setDevice(key)}
                type="button"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className={cn("mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#030609]", device === "mobile" && "mx-auto w-[320px] rounded-[28px]")}>
            <div className={cn("relative", device === "tv" ? "aspect-[16/7]" : "aspect-[16/9]")}>
              <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" src={heroMovie?.backdropUrl || heroMovie?.posterUrl || preferences.backdropFallbackUrl || preferences.posterFallbackUrl} />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_34%,rgba(3,6,9,.18)_78%,rgba(3,6,9,.65)_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Hero</p>
                <p className="mt-2 text-xl font-semibold text-white">{heroMovie?.title ?? "Sem hero"}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">{heroMovie?.description ?? "Selecione um filme no hero."}</p>
              </div>
            </div>

            <div className="space-y-6 p-4">
              {previewRails.map((section) => (
                <div key={`preview-${section.id}`}>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-semibold text-white">{section.title}</p>
                    <span className="text-xs text-white/40">{sourceLabel(section)}</span>
                  </div>
                  <div className="mt-3 flex gap-3 overflow-hidden">
                    {(section.items ?? []).slice(0, device === "mobile" ? 4 : 8).map((item) => (
                      <img
                        alt=""
                        className={cn("aspect-[2/3] shrink-0 rounded-md border border-white/10 object-cover", device === "tv" ? "w-16" : device === "mobile" ? "w-14" : "w-16")}
                        key={item.id}
                        src={item.movie?.posterUrl || preferences.posterFallbackUrl}
                      />
                    ))}
                    {!section.items?.length ? (
                      <div className="rounded-md border border-dashed border-white/14 bg-white/[0.02] px-4 py-3 text-xs text-white/45">
                        secao vazia
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {!previewRails.length ? (
                <div className="rounded-md border border-dashed border-white/14 bg-white/[0.02] px-4 py-4 text-sm text-white/45">
                  Nenhuma secao ativa.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showCreate ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Nova secao</h2>
              <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-black/22 px-3 text-xs font-semibold text-white/70" onClick={() => setShowCreate(false)} type="button">
                <ChevronDown size={14} />
                Fechar
              </button>
            </div>
            <form action={createHomeSectionAction} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-white/55">
                Titulo
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="title" required />
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Slug (opcional)
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" name="slug" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-white/55">
                  Tipo
                  <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="rail" name="type">
                    <option value="rail">rail</option>
                    <option value="hero">hero</option>
                    <option value="collection">collection</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-white/55">
                  Fonte
                  <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="manual" name="sourceType">
                    <option value="manual">manual</option>
                    <option value="collection">collection</option>
                    <option value="recommendation">recommendation</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold text-white/55">
                Colecao (quando fonte=collection)
                <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="" name="sourceId">
                  <option value="">Selecionar colecao</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.status})
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs font-normal text-white/45">
                  Dica: se voce escolher <span className="text-white/65">Fonte = collection</span> mas nao selecionar uma colecao, a secao fica vazia e nao aparece no Browse.
                </span>
              </label>
              <label className="block text-xs font-semibold text-white/55">
                Intelligence (quando fonte=recommendation)
                <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="recommended_for_you" name="sourceKey">
                  {RECOMMENDATION_SECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-white/55">
                  Layout
                  <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue="rail" name="layoutVariant">
                    <option value="rail">rail</option>
                    <option value="poster_grid">poster_grid</option>
                    <option value="featured_banner">featured_banner</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-white/55">
                  Limite
                  <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none" min={1} name="displayLimit" placeholder={`${preferences.cardsPerSection} do Sistema`} type="number" />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                <span>mostrar banner da colecao</span>
                <input className="accent-cinema-cyan" name="showCollectionBanner" type="checkbox" />
              </label>
              <label className="flex items-center justify-between rounded-md border border-white/10 bg-black/22 px-3 py-3 text-sm text-white/70">
                <span>ativa</span>
                <input className="accent-cinema-cyan" defaultChecked name="active" type="checkbox" />
              </label>
              <input name="position" type="hidden" value={String(sections.length)} />
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-sm font-semibold text-slate-950" type="submit">
                <CheckCircle2 size={16} />
                Criar secao
              </button>
            </form>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function HomeSectionItemsList({
  sectionId,
  items,
  itemIds,
  onReorder,
}: {
  sectionId: string;
  items: AdminHomeSection["items"];
  itemIds: string[];
  onReorder: (next: string[]) => void;
}) {
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const ordered = useMemo(() => itemIds.map((id) => byId.get(id)).filter((x): x is (typeof items)[number] => Boolean(x)), [itemIds, byId]);
  const [dragId, setDragId] = useState<string | null>(null);

  const hasChanges = useMemo(() => items.map((i) => i.id).join("|") !== itemIds.join("|"), [items, itemIds]);

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...itemIds];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    onReorder(next);
    setDragId(null);
  };

  return (
    <div className="mt-4">
      {hasChanges ? (
        <form action={reorderHomeSectionItemsAction.bind(null, sectionId)} className="mb-3">
          <input name="order" type="hidden" value={JSON.stringify(itemIds)} />
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-3 text-xs font-semibold text-slate-950" type="submit">
            <Save size={14} />
            Salvar ordem dos itens
          </button>
        </form>
      ) : null}

      <div className="space-y-2">
        {ordered.map((item) => (
          <div
            className="grid grid-cols-[18px_44px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/16 p-2"
            draggable
            key={item.id}
            onDragOver={(e) => e.preventDefault()}
            onDragStart={() => setDragId(item.id)}
            onDrop={() => onDrop(item.id)}
          >
            <GripVertical className="text-white/30" size={16} />
            <img alt="" className="size-10 rounded-md object-cover" src={item.movie?.posterUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{item.movie?.title ?? "Conteudo removido"}</p>
              <p className="text-xs text-white/42">{item.movie?.type ?? "unknown"}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="grid size-9 place-items-center rounded-md border border-white/10 text-white/60 hover:text-white"
                onClick={() => navigator.clipboard?.writeText(item.movie?.id ?? "")}
                title="Copiar id"
                type="button"
              >
                <Copy size={14} />
              </button>
              <form action={removeHomeSectionItemAction.bind(null, item.id)}>
                <button className="grid size-9 place-items-center rounded-md border border-white/10 text-white/60 hover:text-rose-200" title="Remover" type="submit">
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        ))}
        {!ordered.length ? (
          <p className="rounded-lg border border-dashed border-white/14 bg-white/[0.02] px-4 py-3 text-xs text-white/45">
            Nenhum item manual nesta secao.
          </p>
        ) : null}
      </div>
    </div>
  );
}
