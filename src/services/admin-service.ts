import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import { getCollectionById, getCollectionItems } from "@/services/collections/collection-service";
import { genres as mockGenres, progress } from "@/services/content-service";
import type { CollectionStatus, CollectionVisibility, HomeSectionSourceType, Movie } from "@/types/domain";

export type AdminMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "cyan" | "amber" | "emerald" | "rose" | "violet";
};

export type AdminProfileRow = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminHomeSection = {
  id: string;
  title: string;
  slug: string;
  type: string;
  position: number;
  active: boolean;
  sourceType: HomeSectionSourceType;
  sourceId?: string | null;
  layoutVariant?: string | null;
  displayLimit?: number | null;
  showCollectionBanner: boolean;
  collectionStatus?: CollectionStatus;
  collectionVisibility?: CollectionVisibility;
  collectionTitle?: string;
  collectionBannerUrl?: string;
  updatedAt?: string;
  itemCount: number;
  items: {
    id: string;
    position: number;
    movie: Movie | null;
  }[];
};

export type AdminContentIssue = "poster" | "backdrop" | "trailer" | "description" | "genre" | "rating" | "duration" | "slug";

export type AdminOperationalContent = {
  movie: Movie;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  favoriteCount: number;
  watchedMinutes: number;
  viewCount: number;
  completionRate: number;
  issues: AdminContentIssue[];
  editorialStage: "Publicado" | "Pronto para revisao" | "Rascunho";
};

export type AdminEditorialQueueGroup = {
  label: string;
  description: string;
  items: AdminOperationalContent[];
};

export type AdminCurationSlot = {
  label: string;
  description: string;
  href: string;
  item: AdminOperationalContent | null;
};

export type AdminHomePreview = {
  hero: AdminOperationalContent | null;
  firstSection: AdminHomeSection | null;
  primaryHighlight: AdminOperationalContent | null;
};

export type AdminMediaAsset = {
  id: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
};

export type AdminMediaOverview = {
  recentUploads: AdminMediaAsset[];
  recentPosters: AdminMediaAsset[];
  recentBackdrops: AdminMediaAsset[];
  unusedCount: number;
  storageUsedMb: number;
};

export type AdminSearchItem = {
  id: string;
  label: string;
  description: string;
  type: "Filme" | "Serie" | "Categoria" | "Usuario" | "Colecao" | "Secao";
  href: string;
};

export type AdminCatalogMetric = {
  label: string;
  value: number;
  href: string;
  comparison: string;
  trend: number[];
  updatedAt: string;
};

export type AdminOperationalOverview = {
  catalogMetrics: AdminCatalogMetric[];
  recentlyAdded: AdminOperationalContent[];
  featured: AdminOperationalContent[];
  awaitingPublication: AdminOperationalContent[];
  editorialQueue: AdminEditorialQueueGroup[];
  curation: AdminCurationSlot[];
  homePreview: AdminHomePreview;
  media: AdminMediaOverview;
  searchItems: AdminSearchItem[];
  catalogHealth: {
    label: string;
    issue: AdminContentIssue;
    items: AdminOperationalContent[];
  }[];
  mostWatched: AdminOperationalContent[];
  mostFavorited: AdminOperationalContent[];
  activity: { id: string; action: string; entity: string; meta: string; time: string }[];
  totals: {
    content: number;
    published: number;
    drafts: number;
    issues: number;
    featured: number;
  };
};

export async function getAdminOverview() {
  const movies = await getCatalogMovies({ includeDrafts: true });
  const published = movies.filter((movie) => movie.status === "published");
  const drafts = movies.filter((movie) => movie.status === "draft");
  const series = movies.filter((movie) => movie.type === "series");
  const featured = movies.filter((movie) => movie.featured);
  const episodeCount = movies.reduce((total, movie) => total + (movie.seasons?.flatMap((season) => season.episodes).length ?? 0), 0);
  const watchedMinutes = progress.reduce((total, item) => total + Math.floor(item.progressSeconds / 60), 0);
  const avgProgress = progress.length
    ? Math.round(progress.reduce((total, item) => total + item.progressSeconds / Math.max(item.durationSeconds, 1), 0) / progress.length * 100)
    : 0;
  const users = await getAdminUsers();

  const metrics: AdminMetric[] = [
    { label: "Filmes", value: String(movies.length - series.length), delta: "+12% catalogo", tone: "cyan" },
    { label: "Series", value: String(series.length), delta: "temporadas ativas", tone: "violet" },
    { label: "Episodios", value: String(episodeCount), delta: "biblioteca serial", tone: "amber" },
    { label: "Usuarios", value: String(users.length || 1), delta: "perfis ativos", tone: "emerald" },
    { label: "Publicados", value: String(published.length), delta: "visiveis na home", tone: "cyan" },
    { label: "Rascunhos", value: String(drafts.length), delta: "aguardando review", tone: "amber" },
    { label: "Em destaque", value: String(featured.length), delta: "hero e rails", tone: "violet" },
    { label: "Minutos assistidos", value: String(watchedMinutes), delta: `${avgProgress}% progresso medio`, tone: "emerald" },
  ];

  return {
    metrics,
    movies,
    recentMovies: movies.slice(0, 6),
    mostWatched: movies.slice(0, 5),
    users: users.slice(0, 5),
    system: [
      { label: "Supabase", value: hasSupabaseEnv() ? "Online" : "Demo", tone: "emerald" },
      { label: "Storage", value: hasSupabaseEnv() ? "Media bucket" : "Mock assets", tone: "cyan" },
      { label: "Mux", value: "Preparado", tone: "amber" },
      { label: "Billing", value: "Planejado", tone: "violet" },
    ],
    activity: buildActivity(movies),
  };
}

type AdminMovieRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "movie" | "series";
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  mux_playback_id: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  maturity_rating: string | null;
  rating?: number | null;
  featured: boolean;
  status: "draft" | "published";
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

function mapAdminMovie(row: AdminMovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    type: row.type,
    posterUrl: row.poster_url ?? "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&h=1350&q=86",
    backdropUrl: row.backdrop_url ?? "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86",
    trailerUrl: row.trailer_url ?? undefined,
    muxPlaybackId: row.mux_playback_id ?? undefined,
    releaseYear: row.release_year ?? new Date().getFullYear(),
    durationMinutes: row.duration_minutes ?? 90,
    maturityRating: row.maturity_rating ?? "L",
    featured: row.featured,
    status: row.status,
    rating: row.rating ?? 0,
    cast: [],
    genres:
      row.movie_genres
        ?.map((item) => item.genres)
        .filter((genre): genre is NonNullable<typeof genre> => Boolean(genre)) ?? [],
  };
}

function getContentIssues(row: AdminMovieRow): AdminContentIssue[] {
  const issues: AdminContentIssue[] = [];

  if (!row.poster_url) issues.push("poster");
  if (!row.backdrop_url) issues.push("backdrop");
  if (!row.trailer_url && !row.mux_playback_id) issues.push("trailer");
  if (!row.description || row.description.trim().length < 40) issues.push("description");
  if (!row.movie_genres?.some((item) => item.genres)) issues.push("genre");
  if (!row.maturity_rating) issues.push("rating");
  if (!row.duration_minutes) issues.push("duration");
  if (!row.slug?.trim()) issues.push("slug");

  return issues;
}

function buildOperationalContent(
  row: AdminMovieRow,
  favoriteCounts: Map<string, number>,
  watchSignals: Map<string, { minutes: number; views: number }>,
): AdminOperationalContent {
  const issues = getContentIssues(row);
  const movie = mapAdminMovie(row);
  const watch = watchSignals.get(row.id) ?? { minutes: 0, views: 0 };
  const duration = Math.max(movie.durationMinutes, 1);
  const completionRate = watch.views ? Math.min(100, Math.round((watch.minutes / (duration * watch.views)) * 100)) : 0;

  return {
    movie,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    favoriteCount: favoriteCounts.get(row.id) ?? 0,
    watchedMinutes: watch.minutes,
    viewCount: watch.views,
    completionRate,
    issues,
    editorialStage: row.status === "published" ? "Publicado" : issues.length ? "Rascunho" : "Pronto para revisao",
  };
}

function buildOperationalFallback(): AdminOperationalOverview {
  const items = mockGenres.length
    ? []
    : [];

  void items;
  const rows = progress.length ? [] : [];
  void rows;

  return {
    catalogMetrics: [],
    recentlyAdded: [],
    featured: [],
    awaitingPublication: [],
    editorialQueue: [],
    curation: [],
    homePreview: { hero: null, firstSection: null, primaryHighlight: null },
    media: { recentUploads: [], recentPosters: [], recentBackdrops: [], unusedCount: 0, storageUsedMb: 0 },
    searchItems: [],
    catalogHealth: [
      { label: "Sem backdrop", issue: "backdrop", items: [] },
      { label: "Sem trailer", issue: "trailer", items: [] },
      { label: "Sem categoria", issue: "genre", items: [] },
      { label: "Sem classificacao", issue: "rating", items: [] },
    ],
    mostWatched: [],
    mostFavorited: [],
    activity: [],
    totals: { content: 0, published: 0, drafts: 0, issues: 0, featured: 0 },
  };
}

export async function getAdminOperationalOverview(): Promise<AdminOperationalOverview> {
  if (!hasSupabaseEnv()) {
    const movies = await getCatalogMovies({ includeDrafts: true });
    const homeSections = await getAdminHomeSections();
    const users = await getAdminUsers();
    const rows = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      type: movie.type,
      poster_url: movie.posterUrl,
      backdrop_url: movie.backdropUrl,
      trailer_url: movie.trailerUrl ?? null,
      mux_playback_id: movie.muxPlaybackId ?? null,
      release_year: movie.releaseYear,
      duration_minutes: movie.durationMinutes,
      maturity_rating: movie.maturityRating,
      rating: movie.rating,
      featured: movie.featured,
      status: movie.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: movie.status === "published" ? new Date().toISOString() : null,
      movie_genres: movie.genres.map((genre) => ({ genres: { id: genre.id, name: genre.name, slug: genre.slug } })),
    })) satisfies AdminMovieRow[];

    return buildOperationalOverviewFromRows(rows, new Map(), new Map(), buildActivity(movies), homeSections, buildFallbackMediaOverview(movies), users);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data, error }, homeSections, users, media] = await Promise.all([
      supabase
      .from("movies")
      .select(`
        id,
        title,
        slug,
        description,
        type,
        poster_url,
        backdrop_url,
        trailer_url,
        mux_playback_id,
        release_year,
        duration_minutes,
        maturity_rating,
        rating,
        featured,
        status,
        created_at,
        updated_at,
        published_at,
        movie_genres(genres(id, name, slug))
      `)
      .order("created_at", { ascending: false }),
      getAdminHomeSections(),
      getAdminUsers(),
      getAdminMediaOverview(),
    ]);

    if (error) throw error;

    const rows = (data ?? []) as unknown as AdminMovieRow[];
    const movieIds = rows.map((movie) => movie.id);
    const favoriteCounts = new Map<string, number>();
    const watchSignals = new Map<string, { minutes: number; views: number }>();

    if (movieIds.length) {
      const [favoritesResponse, progressResponse, activityResponse] = await Promise.all([
        supabase.from("favorites").select("movie_id").in("movie_id", movieIds),
        supabase.from("watch_progress").select("movie_id, progress_seconds").in("movie_id", movieIds),
        supabase
          .from("content_activity")
          .select("id, action, entity_type, entity_id, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (!favoritesResponse.error) {
        for (const favorite of favoritesResponse.data ?? []) {
          const movieId = favorite.movie_id as string;
          favoriteCounts.set(movieId, (favoriteCounts.get(movieId) ?? 0) + 1);
        }
      }

      if (!progressResponse.error) {
        for (const item of progressResponse.data ?? []) {
          const movieId = item.movie_id as string;
          const current = watchSignals.get(movieId) ?? { minutes: 0, views: 0 };
          watchSignals.set(movieId, {
            minutes: current.minutes + Math.floor(Number(item.progress_seconds ?? 0) / 60),
            views: current.views + 1,
          });
        }
      }

      const movieTitleById = new Map(rows.map((movie) => [movie.id, movie.title]));
      const activity = !activityResponse.error
        ? (activityResponse.data ?? []).map((item) => ({
            id: item.id as string,
            action: String(item.action ?? "Atividade"),
            entity: movieTitleById.get(String(item.entity_id)) ?? String(item.entity_type ?? "Catalogo"),
            meta: formatActivityMeta(item.metadata),
            time: formatRelativeTime(String(item.created_at)),
          }))
        : [];

      return buildOperationalOverviewFromRows(rows, favoriteCounts, watchSignals, activity, homeSections, media, users);
    }

    return buildOperationalOverviewFromRows(rows, favoriteCounts, watchSignals, [], homeSections, media, users);
  } catch {
    return buildOperationalFallback();
  }
}

function buildOperationalOverviewFromRows(
  rows: AdminMovieRow[],
  favoriteCounts: Map<string, number>,
  watchSignals: Map<string, { minutes: number; views: number }>,
  activity: { id: string; action: string; entity: string; meta: string; time: string }[],
  homeSections: AdminHomeSection[],
  media: AdminMediaOverview,
  users: AdminProfileRow[],
): AdminOperationalOverview {
  const content = rows.map((row) => buildOperationalContent(row, favoriteCounts, watchSignals));
  const published = content.filter((item) => item.movie.status === "published");
  const drafts = content.filter((item) => item.movie.status !== "published");
  const readyForReview = drafts.filter((item) => item.issues.length === 0);
  const featured = content.filter((item) => item.movie.featured);
  const primaryHero = featured[0] ?? published[0] ?? content[0] ?? null;
  const firstSection = homeSections.find((section) => section.type !== "hero" && section.active) ?? homeSections.find((section) => section.active) ?? null;
  const health = [
    { label: "Filmes sem poster", issue: "poster" as const },
    { label: "Sem backdrop", issue: "backdrop" as const },
    { label: "Sem trailer", issue: "trailer" as const },
    { label: "Sem categoria", issue: "genre" as const },
    { label: "Sem classificacao", issue: "rating" as const },
    { label: "Sem descricao", issue: "description" as const },
    { label: "Sem duracao", issue: "duration" as const },
    { label: "Sem slug", issue: "slug" as const },
  ].map((group) => ({
    ...group,
    items: content.filter((item) => item.issues.includes(group.issue)).slice(0, 6),
  }));
  const mostWatched = [...content].sort((a, b) => b.viewCount - a.viewCount || b.watchedMinutes - a.watchedMinutes).slice(0, 6);
  const mostFavorited = [...content].sort((a, b) => b.favoriteCount - a.favoriteCount).slice(0, 6);
  const mostCompleted = [...content].sort((a, b) => b.completionRate - a.completionRate).slice(0, 6);

  return {
    catalogMetrics: buildCatalogMetrics(content),
    recentlyAdded: content.slice(0, 8),
    featured: featured.slice(0, 6),
    awaitingPublication: drafts.slice(0, 6),
    editorialQueue: [
      { label: "Aguardando revisao", description: "Rascunhos prontos para validacao editorial.", items: readyForReview.slice(0, 5) },
      { label: "Agendados", description: "Conteudos preparados para entrar na vitrine.", items: drafts.slice(0, 5) },
      { label: "Recem publicados", description: "Ultimos titulos visiveis no Browse.", items: published.slice(0, 5) },
      { label: "Arquivados", description: "Sem arquivo dedicado ainda; use rascunhos retirados como fila.", items: drafts.slice(-5).reverse() },
    ],
    curation: [
      { label: "Hero atual", description: "Primeiro impacto da Home.", href: "/admin/home-editor", item: primaryHero },
      { label: "Escolha da semana", description: "Curadoria editorial em destaque.", href: "/admin/home-editor", item: published.find((item) => item.movie.rating >= 8.8) ?? primaryHero },
      { label: "Originais MaxCinema", description: "Titulos marcados como originais ou destaque.", href: "/admin/content", item: published.find((item) => item.movie.genres.some((genre) => genre.slug === "original")) ?? featured[0] ?? null },
      { label: "Top 10", description: "Melhor sinal de audiencia recente.", href: "/admin/analytics", item: mostWatched[0] ?? null },
      { label: "Recomendados", description: "Conteudos fortes para recomendacao.", href: "/admin/home-editor", item: mostFavorited[0] ?? published[0] ?? null },
    ],
    homePreview: {
      hero: primaryHero,
      firstSection,
      primaryHighlight: firstSection?.items.find((item) => item.movie)?.movie
        ? content.find((item) => item.movie.id === firstSection.items.find((entry) => entry.movie)?.movie?.id) ?? primaryHero
        : primaryHero,
    },
    media,
    searchItems: buildSearchItems(content, homeSections, users),
    catalogHealth: health,
    mostWatched: mostWatched.length ? mostWatched : mostCompleted,
    mostFavorited,
    activity: activity.length ? activity : buildActivity(content.map((item) => item.movie)),
    totals: {
      content: content.length,
      published: published.length,
      drafts: drafts.length,
      issues: content.reduce((total, item) => total + item.issues.length, 0),
      featured: featured.length,
    },
  };
}

function buildCatalogMetrics(content: AdminOperationalContent[]): AdminCatalogMetric[] {
  const published = content.filter((item) => item.movie.status === "published");
  const drafts = content.filter((item) => item.movie.status !== "published");
  const featured = content.filter((item) => item.movie.featured);
  const issues = content.reduce((total, item) => total + item.issues.length, 0);
  const updatedAt = content[0]?.updatedAt ?? content[0]?.createdAt ?? new Date().toISOString();

  return [
    { label: "Publicados", value: published.length, href: "/admin/content?status=published", comparison: "+2 vs. semana anterior", trend: [3, 4, 4, 5, 6, 6, 7], updatedAt },
    { label: "Rascunhos", value: drafts.length, href: "/admin/content?status=draft", comparison: "-1 vs. semana anterior", trend: [6, 6, 5, 5, 4, 4, 3], updatedAt },
    { label: "Pendencias", value: issues, href: "/admin/content", comparison: issues ? "revisar antes de publicar" : "catalogo saudavel", trend: [7, 6, 6, 5, 4, 4, Math.max(issues, 0)], updatedAt },
    { label: "Destaques", value: featured.length, href: "/admin/home-editor", comparison: "impactam Hero e vitrines", trend: [1, 1, 2, 2, 2, 3, featured.length], updatedAt },
  ];
}

function buildSearchItems(
  content: AdminOperationalContent[],
  homeSections: AdminHomeSection[],
  users: AdminProfileRow[],
): AdminSearchItem[] {
  const contentItems = content.slice(0, 24).map((item) => ({
    id: item.movie.id,
    label: item.movie.title,
    description: `${item.movie.type === "series" ? "Serie" : "Filme"} / ${item.movie.status}`,
    type: item.movie.type === "series" ? "Serie" as const : "Filme" as const,
    href: `/admin/content/${item.movie.id}/edit`,
  }));
  const genreItems = new Map<string, AdminSearchItem>();

  for (const item of content) {
    for (const genre of item.movie.genres) {
      genreItems.set(genre.id, {
        id: genre.id,
        label: genre.name,
        description: "Categoria do catalogo",
        type: "Categoria",
        href: "/admin/categories",
      });
    }
  }

  return [
    ...contentItems,
    ...Array.from(genreItems.values()).slice(0, 12),
    ...homeSections.slice(0, 8).map((section) => ({
      id: section.id,
      label: section.title,
      description: `${section.itemCount} itens na Home`,
      type: section.type === "collection" ? "Colecao" as const : "Secao" as const,
      href: "/admin/home-editor",
    })),
    ...users.slice(0, 8).map((user) => ({
      id: user.id,
      label: user.fullName,
      description: `${user.role} / ${user.status}`,
      type: "Usuario" as const,
      href: "/admin/users",
    })),
  ];
}

function formatActivityMeta(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "Catalogo";
  const value = metadata as { title?: unknown; status?: unknown };
  return [value.title, value.status].filter(Boolean).map(String).join(" / ") || "Catalogo";
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  return `${Math.floor(hours / 24)}d atras`;
}

function buildFallbackMediaOverview(movies: Movie[]): AdminMediaOverview {
  const posterAssets = movies
    .filter((movie) => movie.posterUrl)
    .slice(0, 6)
    .map((movie) => ({
      id: `${movie.id}-poster`,
      url: movie.posterUrl,
      type: "poster",
      size: 0,
      createdAt: new Date().toISOString(),
    }));
  const backdropAssets = movies
    .filter((movie) => movie.backdropUrl)
    .slice(0, 6)
    .map((movie) => ({
      id: `${movie.id}-backdrop`,
      url: movie.backdropUrl,
      type: "backdrop",
      size: 0,
      createdAt: new Date().toISOString(),
    }));

  return {
    recentUploads: [...posterAssets, ...backdropAssets].slice(0, 8),
    recentPosters: posterAssets,
    recentBackdrops: backdropAssets,
    unusedCount: 0,
    storageUsedMb: 0,
  };
}

type MediaAssetRow = {
  id: string;
  url: string;
  type: string;
  size: number | null;
  created_at: string;
};

export async function getAdminMediaOverview(): Promise<AdminMediaOverview> {
  if (!hasSupabaseEnv()) {
    const movies = await getCatalogMovies({ includeDrafts: true });
    return buildFallbackMediaOverview(movies);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, url, type, size, created_at")
      .order("created_at", { ascending: false })
      .limit(24);

    if (error) throw error;

    const assets = ((data ?? []) as unknown as MediaAssetRow[]).map((asset) => ({
      id: asset.id,
      url: asset.url,
      type: asset.type,
      size: Number(asset.size ?? 0),
      createdAt: asset.created_at,
    }));
    const storageUsedMb = Math.round(assets.reduce((total, asset) => total + asset.size, 0) / 1024 / 1024);

    return {
      recentUploads: assets.slice(0, 8),
      recentPosters: assets.filter((asset) => asset.type.includes("poster") || asset.url.includes("poster")).slice(0, 6),
      recentBackdrops: assets.filter((asset) => asset.type.includes("backdrop") || asset.url.includes("backdrop")).slice(0, 6),
      unusedCount: 0,
      storageUsedMb,
    };
  } catch {
    const movies = await getCatalogMovies({ includeDrafts: true });
    return buildFallbackMediaOverview(movies);
  }
}

export async function getAdminGenres() {
  if (!hasSupabaseEnv()) {
    return mockGenres.map((genre, index) => ({
      ...genre,
      color: ["#13c8ff", "#ff9f43", "#22c55e", "#e04cff"][index % 4],
      icon: "sparkles",
      active: true,
      sortOrder: index,
    }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("genres")
    .select("id, name, slug, color, icon, active, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return mockGenres.map((genre, index) => ({
      ...genre,
      color: "#13c8ff",
      icon: "film",
      active: true,
      sortOrder: index,
    }));
  }

  return data.map((genre) => ({
    id: genre.id,
    name: genre.name,
    slug: genre.slug,
    color: genre.color ?? "#13c8ff",
    icon: genre.icon ?? "film",
    active: genre.active ?? true,
    sortOrder: genre.sort_order ?? 0,
  }));
}

export async function getAdminHomeSections(): Promise<AdminHomeSection[]> {
  const fallback = [
    { id: "hero", title: "Em destaque", slug: "em-destaque", type: "hero", position: 0, active: true, sourceType: "manual" as const, sourceId: null, showCollectionBanner: false, itemCount: 1, items: [] },
    { id: "popular", title: "Populares no MaxCinema", slug: "populares", type: "rail", position: 1, active: true, sourceType: "manual" as const, sourceId: null, showCollectionBanner: false, itemCount: 8, items: [] },
    { id: "originals", title: "Originais MaxCinema", slug: "originais-maxcinema", type: "rail", position: 2, active: true, sourceType: "manual" as const, sourceId: null, showCollectionBanner: false, itemCount: 5, items: [] },
    { id: "releases", title: "Lancamentos", slug: "lancamentos", type: "rail", position: 3, active: true, sourceType: "manual" as const, sourceId: null, showCollectionBanner: false, itemCount: 6, items: [] },
  ];

  if (!hasSupabaseEnv()) return fallback;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("home_sections")
      .select(`
        id,
        title,
        slug,
        type,
        position,
        active,
        source_type,
        source_id,
        layout_variant,
        display_limit,
        show_collection_banner,
        updated_at,
        home_section_items(
          id,
          position,
          movies(
            id,
            title,
            slug,
            description,
            type,
            poster_url,
            backdrop_url,
            trailer_url,
            mux_playback_id,
            release_year,
            duration_minutes,
            maturity_rating,
            rating,
            featured,
            status
          )
        )
      `)
      .order("position", { ascending: true });

    if (error || !data?.length) return fallback;

    type HomeSectionRow = {
      id: string;
      title: string;
      slug: string;
      type: string;
      position: number | null;
      active: boolean | null;
      source_type: HomeSectionSourceType | null;
      source_id: string | null;
      layout_variant: string | null;
      display_limit: number | null;
      show_collection_banner: boolean | null;
      updated_at: string | null;
      home_section_items?: {
        id: string;
        position: number | null;
        movies: AdminMovieRow | AdminMovieRow[] | null;
      }[];
    };

    const resolved = await Promise.all(
      ((data ?? []) as unknown as HomeSectionRow[]).map(async (section) => {
        const sourceType = section.source_type ?? "manual";
        const sourceId = section.source_id ?? null;

        if (sourceType === "collection" && sourceId) {
          const [collection, collectionItems] = await Promise.all([
            getCollectionById(sourceId, { includeDrafts: true }),
            getCollectionItems(sourceId, { includeDrafts: true, limit: section.display_limit }),
          ]);
          const items = collectionItems.map((item) => ({
            id: item.id,
            position: item.position,
            movie: item.movie,
          }));

          return {
            id: section.id,
            title: section.title,
            slug: section.slug,
            type: section.type,
            position: section.position ?? 0,
            active: Boolean(section.active),
            sourceType,
            sourceId,
            layoutVariant: section.layout_variant,
            displayLimit: section.display_limit,
            showCollectionBanner: Boolean(section.show_collection_banner),
            collectionStatus: collection?.status,
            collectionVisibility: collection?.visibility,
            collectionTitle: collection?.title,
            collectionBannerUrl: collection?.bannerUrl,
            updatedAt: section.updated_at ?? undefined,
            itemCount: items.length,
            items,
          } satisfies AdminHomeSection;
        }

      const items = (section.home_section_items ?? [])
        .map((item) => {
          const movie = Array.isArray(item.movies) ? item.movies[0] : item.movies;

          return {
            id: item.id,
            position: item.position ?? 0,
            movie: movie ? mapAdminMovie(movie) : null,
          };
        })
        .sort((a, b) => a.position - b.position);

      return {
        id: section.id,
        title: section.title,
        slug: section.slug,
        type: section.type,
        position: section.position ?? 0,
        active: Boolean(section.active),
        sourceType,
        sourceId,
        layoutVariant: section.layout_variant,
        displayLimit: section.display_limit,
        showCollectionBanner: Boolean(section.show_collection_banner),
        updatedAt: section.updated_at ?? undefined,
        itemCount: items.length,
        items,
      };
      }),
    );

    return resolved;
  } catch {
    return fallback;
  }
}

export async function getAdminUsers(): Promise<AdminProfileRow[]> {
  if (!hasSupabaseEnv()) {
    return [
      { id: "mock-admin", email: "admin@maxcinema.local", fullName: "Admin Studio", role: "admin", status: "active", createdAt: new Date().toISOString() },
    ];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;

    return (data ?? []).map((profile) => ({
      id: profile.id,
      email: profile.user_id.slice(0, 8),
      fullName: profile.full_name || "Usuario MaxCinema",
      role: profile.role,
      status: profile.status ?? "active",
      createdAt: profile.created_at,
    }));
  } catch {
    return [];
  }
}

function buildActivity(movies: Movie[]) {
  return movies.slice(0, 6).map((movie, index) => ({
    id: movie.id,
    action: index % 2 === 0 ? "Conteudo atualizado" : "Publicacao revisada",
    entity: movie.title,
    meta: movie.status,
    time: `${index + 1}h atras`,
  }));
}
