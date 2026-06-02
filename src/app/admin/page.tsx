import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Film,
  Heart,
  ImageIcon,
  Layers3,
  Pencil,
  PlayCircle,
  Plus,
  Star,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import {
  publishMovieAction,
  toggleFeaturedMovieAction,
} from "@/app/admin/actions";
import { AdminGlobalSearch } from "@/components/admin/dashboard/AdminGlobalSearch";
import { AdminActivityFeed } from "@/components/admin/dashboard/AdminActivityFeed";
import { ContentStatusBadge } from "@/components/admin/shared/ContentStatusBadge";
import {
  getAdminOperationalOverview,
  type AdminCatalogMetric,
  type AdminOperationalContent,
} from "@/services/admin-service";
import { getSettingValue, getSettings } from "@/services/settings/settings-service";
import { cn } from "@/utils/cn";

function formatDate(value?: string) {
  if (!value) return "Nao publicado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-normal text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
      </div>
      {action ? (
        <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-white/62 transition hover:border-cinema-cyan/35 hover:text-white" href={action.href}>
          {action.label}
          <ArrowRight size={14} />
        </Link>
      ) : null}
    </div>
  );
}

function TrendLine({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <span
          className="w-1.5 rounded-full bg-cinema-cyan/55"
          key={`${value}-${index}`}
          style={{ height: `${Math.max(15, Math.round((value / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

function CatalogMetricCard({ metric }: { metric: AdminCatalogMetric }) {
  return (
    <Link
      className="group rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-cinema-cyan/35 hover:bg-white/[0.055]"
      href={metric.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-white/38">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
        </div>
        <TrendLine values={metric.trend} />
      </div>
      <p className="mt-3 text-xs text-white/45">{metric.comparison}</p>
      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-white/38">
        <span>Atualizado {formatDate(metric.updatedAt)}</span>
        <ArrowRight className="transition group-hover:text-cinema-cyan" size={14} />
      </div>
    </Link>
  );
}

function ContentMiniRow({
  item,
  action = "edit",
}: {
  item: AdminOperationalContent;
  action?: "edit" | "publish" | "view";
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/8 bg-black/16 p-2.5 transition hover:bg-white/[0.045]">
      <img alt="" className="h-14 w-10 rounded object-cover ring-1 ring-white/10" src={item.movie.posterUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.movie.title}</p>
        <p className="mt-1 truncate text-xs text-white/42">
          {item.movie.type === "series" ? "Serie" : "Filme"} / {item.movie.genres[0]?.name ?? "Sem genero"} / {item.editorialStage}
        </p>
      </div>
      {action === "publish" ? (
        <form action={publishMovieAction.bind(null, item.movie.id)}>
          <button className="grid size-8 place-items-center rounded-md bg-cinema-cyan text-slate-950 transition hover:bg-[#65ddff]" title="Publicar" type="submit">
            <CheckCircle2 size={15} />
          </button>
        </form>
      ) : (
        <Link
          className="grid size-8 place-items-center rounded-md border border-white/10 text-white/48 transition hover:text-white"
          href={action === "view" ? `/movie/${item.movie.slug}` : `/admin/content/${item.movie.id}/edit`}
          title={action === "view" ? "Ver no Browse" : "Editar"}
        >
          {action === "view" ? <PlayCircle size={15} /> : <Pencil size={15} />}
        </Link>
      )}
    </div>
  );
}

function CatalogHealthPanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Abrir catalogo", href: "/admin/content" }}
        description="Problemas editoriais que impedem uma exibicao premium no Browse."
        title="Saude do catalogo"
      />
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {overview.catalogHealth.map((group) => (
          <Link
            className={cn(
              "rounded-md border p-3 transition hover:bg-white/[0.055]",
              group.items.length ? "border-amber-300/20 bg-amber-300/[0.055]" : "border-emerald-300/14 bg-emerald-300/[0.035]",
            )}
            href={group.items[0] ? `/admin/content/${group.items[0].movie.id}/edit` : "/admin/content"}
            key={group.issue}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white/74">{group.label}</span>
              <span className={cn("text-lg font-semibold", group.items.length ? "text-cinema-amber" : "text-emerald-300")}>{group.items.length}</span>
            </div>
            <p className="mt-2 text-xs text-white/38">{group.items[0]?.movie.title ?? "Nenhuma pendencia aberta"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EditorialQueuePanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Ver publicacoes", href: "/admin/content" }}
        description="Conteudos organizados por decisao editorial, nao apenas por status tecnico."
        title="Fila editorial"
      />
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {overview.editorialQueue.map((group) => (
          <div className="rounded-md border border-white/8 bg-black/16 p-3" key={group.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{group.label}</h3>
                <p className="mt-1 text-xs leading-5 text-white/40">{group.description}</p>
              </div>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/56">{group.items.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.length ? (
                group.items.slice(0, 3).map((item) => (
                  <ContentMiniRow action={group.label === "Aguardando revisao" ? "publish" : "edit"} item={item} key={item.movie.id} />
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/10 p-3 text-xs text-white/38">Nada nesta fila agora.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePreviewPanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  const hero = overview.homePreview.hero;
  const firstSection = overview.homePreview.firstSection;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Editar Home", href: "/admin/home-editor" }}
        description="Preview vivo alimentado pelos mesmos dados usados no Browse."
        title="Previa da Home"
      />
      {hero ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-black/24">
          <div className="relative min-h-[280px]">
            <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-72" src={hero.movie.backdropUrl} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />
            <div className="relative z-10 flex min-h-[280px] max-w-2xl flex-col justify-end p-5">
              <p className="text-xs font-semibold uppercase text-cinema-cyan">Hero atual</p>
              <h3 className="mt-2 text-4xl font-semibold leading-tight text-white">{hero.movie.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/64">{hero.movie.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-950" href={`/movie/${hero.movie.slug}`}>
                  <PlayCircle size={16} />
                  Ver no Browse
                </Link>
                <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/14 bg-white/[0.07] px-4 text-sm font-semibold text-white/78" href="/admin/home-editor">
                  <Pencil size={16} />
                  Editar vitrine
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{firstSection?.title ?? "Primeira secao"}</p>
                <p className="mt-1 text-xs text-white/40">{firstSection?.itemCount ?? 0} itens ativos na Home</p>
              </div>
              <Link className="text-sm font-semibold text-cinema-cyan hover:text-white" href="/browse">Abrir plataforma</Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(firstSection?.items ?? []).slice(0, 5).map((entry) => (
                entry.movie ? (
                  <img alt="" className="aspect-[16/10] rounded object-cover ring-1 ring-white/10" key={entry.id} src={entry.movie.backdropUrl} />
                ) : null
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-md border border-dashed border-white/12 bg-white/[0.025] p-5 text-sm text-white/45">Nenhum conteudo disponivel para montar a previa.</p>
      )}
    </section>
  );
}

function CurationPanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Home Editor", href: "/admin/home-editor" }}
        description="Controle editorial dos espacos que definem a experiencia do usuario."
        title="Curadoria"
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {overview.curation.map((slot) => (
          <Link className="group overflow-hidden rounded-md border border-white/8 bg-black/18 transition hover:border-cinema-cyan/30 hover:bg-white/[0.045]" href={slot.href} key={slot.label}>
            <div className="aspect-video bg-white/[0.035]">
              {slot.item ? <img alt="" className="h-full w-full object-cover opacity-82 transition group-hover:scale-105" src={slot.item.movie.backdropUrl} /> : null}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-white">{slot.label}</p>
              <p className="mt-1 line-clamp-1 text-xs text-white/42">{slot.item?.movie.title ?? slot.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentContentGrid({ items }: { items: AdminOperationalContent[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Biblioteca", href: "/admin/content" }}
        description="Ultimos conteudos adicionados com status, genero, destaque e publicacao."
        title="Conteudos recentes"
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 8).map((item) => (
          <article className="group overflow-hidden rounded-lg border border-white/10 bg-black/18 transition hover:border-white/20 hover:bg-white/[0.045]" key={item.movie.id}>
            <div className="relative aspect-[3/4] overflow-hidden bg-white/[0.035]">
              <img alt="" className="h-full w-full object-cover opacity-88 transition duration-500 group-hover:scale-105" src={item.movie.posterUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-transparent" />
              <div className="absolute left-3 top-3">
                <ContentStatusBadge status={item.movie.status} />
              </div>
              <form action={toggleFeaturedMovieAction.bind(null, item.movie.id, !item.movie.featured)} className="absolute right-3 top-3">
                <button className="grid size-8 place-items-center rounded-md border border-white/15 bg-black/46 text-cinema-amber backdrop-blur transition hover:bg-black/70" type="submit">
                  {item.movie.featured ? <Star fill="currentColor" size={15} /> : <Star size={15} />}
                </button>
              </form>
            </div>
            <div className="p-3">
              <h3 className="truncate text-sm font-semibold text-white">{item.movie.title}</h3>
              <p className="mt-1 text-xs text-white/42">{item.movie.genres[0]?.name ?? "Sem genero"} / {formatDate(item.publishedAt)}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-xs text-white/38">{item.issues.length ? `${item.issues.length} pendencias` : "Pronto"}</span>
                <Link className="grid size-8 place-items-center rounded-md border border-white/10 text-white/48 hover:text-white" href={`/admin/content/${item.movie.id}/edit`}>
                  <Pencil size={14} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MediaLibraryPanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  const assets = overview.media.recentUploads.slice(0, 6);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Midia", href: "/admin/media" }}
        description="Uploads, posters, backdrops, midias sem uso e uso estimado de storage."
        title="Biblioteca de midia"
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="grid grid-cols-3 gap-2">
          {assets.length ? assets.map((asset) => (
            <div className="overflow-hidden rounded-md border border-white/8 bg-black/18" key={asset.id}>
              <img alt="" className="aspect-video w-full object-cover opacity-86" src={asset.url} />
              <p className="truncate px-2 py-2 text-xs text-white/42">{asset.type}</p>
            </div>
          )) : (
            <p className="col-span-3 rounded-md border border-dashed border-white/12 p-4 text-sm text-white/45">Nenhum upload registrado.</p>
          )}
        </div>
        <div className="grid gap-2">
          {[
            { label: "Uploads recentes", value: overview.media.recentUploads.length, icon: UploadCloud },
            { label: "Posters recentes", value: overview.media.recentPosters.length, icon: ImageIcon },
            { label: "Backdrops recentes", value: overview.media.recentBackdrops.length, icon: Layers3 },
            { label: "Midias sem uso", value: overview.media.unusedCount, icon: Film },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
            <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/18 p-3" key={stat.label}>
              <span className="flex items-center gap-2 text-xs text-white/48"><Icon size={14} />{stat.label}</span>
              <span className="text-sm font-semibold text-white">{stat.value}</span>
            </div>
            );
          })}
          <div className="rounded-md border border-cinema-cyan/18 bg-cinema-cyan/[0.055] p-3">
            <p className="text-xs text-white/45">Storage utilizado</p>
            <p className="mt-1 text-2xl font-semibold text-white">{overview.media.storageUsedMb} MB</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformancePanel({ overview }: { overview: Awaited<ReturnType<typeof getAdminOperationalOverview>> }) {
  const rows = [
    { label: "Mais assistidos", icon: Eye, items: overview.mostWatched, value: (item: AdminOperationalContent) => `${item.viewCount} views` },
    { label: "Mais favoritados", icon: Heart, items: overview.mostFavorited, value: (item: AdminOperationalContent) => `${item.favoriteCount} favoritos` },
    { label: "Maior tempo assistido", icon: Clock3, items: [...overview.mostWatched].sort((a, b) => b.watchedMinutes - a.watchedMinutes), value: (item: AdminOperationalContent) => `${item.watchedMinutes} min` },
    { label: "Maior conclusao", icon: CheckCircle2, items: [...overview.mostWatched].sort((a, b) => b.completionRate - a.completionRate), value: (item: AdminOperationalContent) => `${item.completionRate}%` },
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <SectionHeader
        action={{ label: "Analytics", href: "/admin/analytics" }}
        description="Sinais reais de streaming: audiencia, favoritos, tempo assistido, conclusao e cliques."
        title="Performance real"
      />
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {rows.map((group) => {
          const Icon = group.icon;
          return (
            <div className="rounded-md border border-white/8 bg-black/16 p-3" key={group.label}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="text-cinema-cyan" size={16} />{group.label}</h3>
              <div className="mt-3 space-y-2">
                {group.items.slice(0, 4).map((item) => (
                  <Link className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-white/[0.055]" href={`/admin/content/${item.movie.id}/edit`} key={item.movie.id}>
                    <span className="min-w-0 truncate text-white/66">{item.movie.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-white">{group.value(item)}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function AdminPage() {
  const [overview, settings] = await Promise.all([getAdminOperationalOverview(), getSettings()]);
  const showMetrics = getSettingValue(settings, "admin.showMetrics", true);
  const showPreviews = getSettingValue(settings, "admin.showPreviews", true);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,.28)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-cinema-cyan">MaxCinema Studio</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-white md:text-5xl">Operacao da plataforma</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cinema-muted">
              Controle de catalogo, curadoria, vitrine, midia e performance usando a mesma fonte de dados do Browse.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 hover:bg-[#65ddff]" href="/admin/content/new">
              <Plus size={16} />
              Novo conteudo
            </Link>
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white" href="/browse">
              <Eye size={16} />
              Ver plataforma
            </Link>
          </div>
        </div>
        {showMetrics ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overview.catalogMetrics.map((metric) => <CatalogMetricCard key={metric.label} metric={metric} />)}
          </div>
        ) : null}
      </section>

      <AdminGlobalSearch items={overview.searchItems} />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-6">
          <CatalogHealthPanel overview={overview} />
          <EditorialQueuePanel overview={overview} />
          {showPreviews ? <HomePreviewPanel overview={overview} /> : null}
          <CurationPanel overview={overview} />
          <RecentContentGrid items={overview.recentlyAdded} />
          <MediaLibraryPanel overview={overview} />
          <PerformancePanel overview={overview} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <SectionHeader
              action={{ label: "Revisar", href: "/admin/content" }}
              description="O que precisa de acao agora."
              title="Agora no Studio"
            />
            <div className="mt-5 space-y-3">
              {overview.awaitingPublication.slice(0, 5).map((item) => (
                <ContentMiniRow action="publish" item={item} key={item.movie.id} />
              ))}
              {!overview.awaitingPublication.length ? (
                <p className="rounded-md border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm text-white/45">Nenhum conteudo aguardando publicacao.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <SectionHeader
              action={{ label: "Agendar", href: "/admin/home-editor" }}
              description="Atalhos para operacao editorial."
              title="Acoes rapidas"
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { label: "Novo filme", href: "/admin/content/new", icon: Plus },
                { label: "Nova categoria", href: "/admin/categories", icon: Layers3 },
                { label: "Editar Hero", href: "/admin/home-editor", icon: Star },
                { label: "Subir midia", href: "/admin/media", icon: UploadCloud },
                { label: "Ver plataforma", href: "/browse", icon: Eye },
                { label: "Analytics", href: "/admin/analytics", icon: Film },
              ].map((action) => {
                const Icon = action.icon;
                return (
                <Link className="flex min-h-24 flex-col justify-between rounded-md border border-white/8 bg-black/18 p-3 text-sm font-semibold text-white/68 transition hover:border-cinema-cyan/30 hover:text-white" href={action.href} key={action.label}>
                  <Icon className="text-cinema-cyan" size={18} />
                  {action.label}
                </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <SectionHeader
              action={{ label: "Publicacoes", href: "/admin/content" }}
              description="Agenda e publicacao do catalogo."
              title="Publicacao"
            />
            <div className="mt-5 space-y-3">
              {overview.editorialQueue.find((group) => group.label === "Agendados")?.items.slice(0, 4).map((item) => (
                <div className="rounded-md border border-white/8 bg-black/18 p-3" key={item.movie.id}>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="shrink-0 text-cinema-amber" size={17} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.movie.title}</p>
                      <p className="mt-1 text-xs text-white/42">Criado {formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <AdminActivityFeed activity={overview.activity} />
        </aside>
      </section>
    </div>
  );
}
