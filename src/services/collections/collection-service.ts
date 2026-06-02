import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import {
  getHighRatedContent,
  getNewReleasesForYou,
  getPopularOnMaxCinema,
  getRecommendedForYou,
  getTonightPicks,
  getTrendingForProfile,
} from "@/services/recommendation/recommendation-engine";
import type {
  Collection,
  CollectionItem,
  CollectionStatus,
  CollectionType,
  CollectionVisibility,
  HomeSectionSourceType,
  HomeSectionWithItems,
  Movie,
} from "@/types/domain";

const COLLECTION_SELECT =
  "id, title, slug, description, short_description, banner_url, cover_url, accent_color, icon, type, status, visibility, sort_order, is_featured, starts_at, ends_at, created_at, updated_at";

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  banner_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  icon: string | null;
  type: CollectionType | null;
  status: CollectionStatus | null;
  visibility: CollectionVisibility | null;
  sort_order: number | null;
  is_featured: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CollectionItemRow = {
  id: string;
  collection_id: string;
  movie_id?: string | null;
  position: number | null;
  note: string | null;
  pinned: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string | null;
  movies?: { id: string } | { id: string }[] | null;
};

type HomeSectionSourceRow = {
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
  updated_at?: string | null;
};

export type CollectionInput = Partial<{
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  bannerUrl: string | null;
  coverUrl: string | null;
  accentColor: string;
  icon: string;
  type: CollectionType;
  status: CollectionStatus;
  visibility: CollectionVisibility;
  sortOrder: number;
  isFeatured: boolean;
  startsAt: string | null;
  endsAt: string | null;
  actorId: string;
}>;

export class CollectionServiceError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "CollectionServiceError";
  }
}

function fail(message: string, cause?: unknown): never {
  throw new CollectionServiceError(message, cause);
}

function mapCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",
    bannerUrl: row.banner_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    accentColor: row.accent_color ?? "#13c8ff",
    icon: row.icon ?? "film",
    type: row.type ?? "editorial",
    status: row.status ?? "draft",
    visibility: row.visibility ?? "public",
    sortOrder: row.sort_order ?? 0,
    isFeatured: Boolean(row.is_featured),
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function withinWindow(item: { startsAt?: string; endsAt?: string }) {
  const now = Date.now();
  const starts = item.startsAt ? new Date(item.startsAt).getTime() : null;
  const ends = item.endsAt ? new Date(item.endsAt).getTime() : null;
  if (starts && now < starts) return false;
  if (ends && now > ends) return false;
  return true;
}

function isPublicCollection(collection: Collection) {
  return collection.status === "published" && collection.visibility === "public" && withinWindow(collection);
}

function orderItems(items: CollectionItem[]) {
  return [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.position - b.position);
}

function isDynamicCollection(collection: Collection) {
  return ["dynamic", "top_10", "originals", "trending", "recommended"].includes(collection.type);
}

async function getDynamicCollectionItems(collection: Collection, { includeDrafts = false, limit }: { includeDrafts?: boolean; limit?: number | null } = {}) {
  const resolvedLimit = limit && limit > 0 ? limit : 10;
  let movies: Movie[];

  if (collection.type === "top_10") {
    movies = (await getHighRatedContent(resolvedLimit)).items.map((item) => item.movie);
  } else if (collection.type === "trending") {
    movies = (await getTrendingForProfile(resolvedLimit)).items.map((item) => item.movie);
  } else if (collection.type === "recommended") {
    movies = (await getRecommendedForYou(resolvedLimit)).items.map((item) => item.movie);
  } else if (collection.type === "originals") {
    movies = (await getCatalogMovies({ includeDrafts })).filter((movie) => movie.genres.some((genre) => genre.slug === "original"));
  } else {
    const title = `${collection.title} ${collection.slug}`.toLocaleLowerCase("pt-BR");
    if (title.includes("noite") || title.includes("tonight")) {
      movies = (await getTonightPicks(resolvedLimit)).items.map((item) => item.movie);
    } else if (title.includes("lanc")) {
      movies = (await getNewReleasesForYou(resolvedLimit)).items.map((item) => item.movie);
    } else {
      movies = (await getPopularOnMaxCinema(resolvedLimit)).items.map((item) => item.movie);
    }
  }

  return movies
    .filter((movie) => includeDrafts || movie.status === "published")
    .slice(0, resolvedLimit)
    .map((movie, index) => ({
      id: `dynamic-${collection.id}-${movie.id}`,
      collectionId: collection.id,
      movie,
      position: index,
      pinned: false,
      note: "dynamic",
      createdAt: collection.updatedAt,
    })) satisfies CollectionItem[];
}

function demoCollections(): Collection[] {
  return [
    {
      id: "demo-top-10",
      title: "Top 10 da semana",
      slug: "top-10-da-semana",
      description: "Os destaques do momento no MaxCinema.",
      shortDescription: "Top 10 editorial",
      accentColor: "#13c8ff",
      icon: "sparkles",
      type: "top_10",
      status: "published",
      visibility: "public",
      sortOrder: 0,
      isFeatured: true,
    },
    {
      id: "demo-hoje-a-noite",
      title: "Filmes para hoje a noite",
      slug: "filmes-para-hoje-a-noite",
      description: "Curadoria para abrir e dar play.",
      shortDescription: "Curadoria",
      accentColor: "#ff9f43",
      icon: "moon",
      type: "editorial",
      status: "published",
      visibility: "public",
      sortOrder: 1,
      isFeatured: false,
    },
  ];
}

function rowToPatch(input: CollectionInput) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.shortDescription !== undefined ? { short_description: input.shortDescription } : {}),
    ...(input.bannerUrl !== undefined ? { banner_url: input.bannerUrl } : {}),
    ...(input.coverUrl !== undefined ? { cover_url: input.coverUrl } : {}),
    ...(input.accentColor !== undefined ? { accent_color: input.accentColor } : {}),
    ...(input.icon !== undefined ? { icon: input.icon } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isFeatured !== undefined ? { is_featured: input.isFeatured } : {}),
    ...(input.startsAt !== undefined ? { starts_at: input.startsAt } : {}),
    ...(input.endsAt !== undefined ? { ends_at: input.endsAt } : {}),
    ...(input.actorId !== undefined ? { updated_by: input.actorId } : {}),
  };
}

export async function getCollections({ includeDrafts = false } = {}): Promise<Collection[]> {
  if (!hasSupabaseEnv()) {
    const collections = demoCollections();
    return includeDrafts ? collections : collections.filter(isPublicCollection);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("collections")
    .select(COLLECTION_SELECT)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("status", "published").eq("visibility", "public");
  }

  const { data, error } = await query;
  if (error) fail("Falha ao buscar colecoes.", error);

  const collections = ((data ?? []) as unknown as CollectionRow[]).map(mapCollection);
  return includeDrafts ? collections : collections.filter(isPublicCollection);
}

export async function getPublishedCollections() {
  return getCollections({ includeDrafts: false });
}

export async function getCollectionBySlug(slug: string, { includeDrafts = false } = {}) {
  const collections = await getCollections({ includeDrafts });
  return collections.find((collection) => collection.slug === slug);
}

export async function getCollectionById(id: string, { includeDrafts = false } = {}) {
  const collections = await getCollections({ includeDrafts });
  return collections.find((collection) => collection.id === id);
}

export async function createCollection(input: CollectionInput): Promise<Collection> {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para criar colecoes.");
  if (!input.title || !input.slug) fail("Titulo e slug sao obrigatorios para criar colecao.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description ?? "",
      short_description: input.shortDescription ?? "",
      banner_url: input.bannerUrl ?? null,
      cover_url: input.coverUrl ?? null,
      accent_color: input.accentColor ?? "#13c8ff",
      icon: input.icon ?? "film",
      type: input.type ?? "editorial",
      status: input.status ?? "draft",
      visibility: input.visibility ?? "public",
      sort_order: input.sortOrder ?? 0,
      is_featured: input.isFeatured ?? false,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      created_by: input.actorId,
      updated_by: input.actorId,
    })
    .select(COLLECTION_SELECT)
    .single();

  if (error || !data) fail("Falha ao criar colecao.", error);
  return mapCollection(data as CollectionRow);
}

export async function updateCollection(collectionId: string, input: CollectionInput): Promise<Collection> {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para atualizar colecoes.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collections")
    .update(rowToPatch(input))
    .eq("id", collectionId)
    .select(COLLECTION_SELECT)
    .single();

  if (error || !data) fail("Falha ao atualizar colecao.", error);
  return mapCollection(data as CollectionRow);
}

export async function deleteCollection(collectionId: string) {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para excluir colecoes.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);
  if (error) fail("Falha ao excluir colecao.", error);
}

export async function archiveCollection(collectionId: string, actorId?: string) {
  return updateCollection(collectionId, { status: "archived", actorId });
}

export async function publishCollection(collectionId: string, actorId?: string) {
  return updateCollection(collectionId, { status: "published", actorId });
}

export async function duplicateCollection(collectionId: string, actorId?: string): Promise<Collection> {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para duplicar colecoes.");

  const base = await getCollectionById(collectionId, { includeDrafts: true });
  if (!base) fail("Colecao nao encontrada.");

  const copy = await createCollection({
    ...base,
    title: `${base.title} Copy`,
    slug: `${base.slug}-copy-${Date.now().toString(36)}`,
    status: "draft",
    isFeatured: false,
    actorId,
  });

  const supabase = await createSupabaseServerClient();
  const { data: baseItems, error } = await supabase
    .from("collection_items")
    .select("movie_id, position, note, pinned, starts_at, ends_at")
    .eq("collection_id", collectionId)
    .order("position", { ascending: true });

  if (error) fail("Falha ao buscar itens para duplicar colecao.", error);

  const rows = (baseItems ?? []) as {
    movie_id: string;
    position: number | null;
    note: string | null;
    pinned: boolean | null;
    starts_at: string | null;
    ends_at: string | null;
  }[];

  if (rows.length) {
    const { error: insertError } = await supabase.from("collection_items").insert(
      rows.map((item) => ({
        collection_id: copy.id,
        movie_id: item.movie_id,
        position: item.position ?? 0,
        note: item.note,
        pinned: item.pinned ?? false,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
      })),
    );
    if (insertError) fail("Falha ao duplicar itens da colecao.", insertError);
  }

  return copy;
}

export async function getCollectionItems(collectionId: string, { includeDrafts = false, limit }: { includeDrafts?: boolean; limit?: number | null } = {}) {
  const collection = await getCollectionById(collectionId, { includeDrafts: true });
  if (collection && isDynamicCollection(collection)) {
    if (!includeDrafts && !isPublicCollection(collection)) return [];
    return getDynamicCollectionItems(collection, { includeDrafts, limit });
  }

  if (!hasSupabaseEnv()) {
    const catalog = await getCatalogMovies({ includeDrafts: true });
    const items = catalog.slice(0, limit ?? 10).map((movie, index) => ({
      id: `demo-item-${collectionId}-${index}`,
      collectionId,
      movie,
      position: index,
      note: "",
      pinned: false,
      createdAt: new Date().toISOString(),
    })) satisfies CollectionItem[];
    return includeDrafts ? items : items.filter((item) => item.movie.status === "published");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_items")
    .select("id, collection_id, movie_id, position, note, pinned, starts_at, ends_at, created_at, movies(id)")
    .eq("collection_id", collectionId)
    .order("pinned", { ascending: false })
    .order("position", { ascending: true });

  if (error) fail("Falha ao buscar itens da colecao.", error);

  const rows = (data ?? []) as unknown as CollectionItemRow[];
  const movies = await getCatalogMovies({ includeDrafts: true });
  const byId = new Map<string, Movie>(movies.map((movie) => [movie.id, movie]));

  const items = rows
    .map((row): CollectionItem | null => {
      const rawMovie = Array.isArray(row.movies) ? row.movies[0] : row.movies;
      const movieId = row.movie_id ?? rawMovie?.id;
      const movie = movieId ? byId.get(movieId) : undefined;
      if (!movie) return null;
      return {
        id: row.id,
        collectionId: row.collection_id,
        movie,
        position: row.position ?? 0,
        note: row.note ?? undefined,
        pinned: Boolean(row.pinned),
        startsAt: row.starts_at ?? undefined,
        endsAt: row.ends_at ?? undefined,
        createdAt: row.created_at ?? undefined,
      };
    })
    .filter((item): item is CollectionItem => Boolean(item));

  const visible = includeDrafts
    ? items
    : items.filter((item) => item.movie.status === "published" && withinWindow(item));

  const ordered = orderItems(visible);
  return typeof limit === "number" && limit > 0 ? ordered.slice(0, limit) : ordered;
}

export async function addCollectionItem(
  collectionId: string,
  input: { movieId: string; position?: number; note?: string | null; pinned?: boolean; startsAt?: string | null; endsAt?: string | null },
) {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para adicionar itens.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_items")
    .upsert(
      {
        collection_id: collectionId,
        movie_id: input.movieId,
        position: input.position ?? 0,
        note: input.note ?? null,
        pinned: input.pinned ?? false,
        starts_at: input.startsAt ?? null,
        ends_at: input.endsAt ?? null,
      },
      { onConflict: "collection_id,movie_id" },
    )
    .select("id")
    .single();

  if (error || !data) fail("Falha ao adicionar item na colecao.", error);
  return String(data.id);
}

export async function removeCollectionItem(itemId: string) {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para remover itens.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("collection_items").delete().eq("id", itemId);
  if (error) fail("Falha ao remover item da colecao.", error);
}

export async function reorderCollectionItems(collectionId: string, itemIds: string[]) {
  if (!hasSupabaseEnv()) fail("Supabase nao configurado para reordenar itens.");
  const supabase = await createSupabaseServerClient();

  for (let position = 0; position < itemIds.length; position += 1) {
    const { error } = await supabase
      .from("collection_items")
      .update({ position })
      .eq("collection_id", collectionId)
      .eq("id", itemIds[position]);
    if (error) fail("Falha ao reordenar itens da colecao.", error);
  }
}

export async function getCollectionForHomeSection(section: HomeSectionSourceRow): Promise<HomeSectionWithItems | null> {
  if (section.source_type !== "collection" || !section.source_id || section.active === false) return null;

  const collection = await getCollectionById(section.source_id, { includeDrafts: false });
  if (!collection) return null;

  const items = await getCollectionItems(collection.id, { includeDrafts: false, limit: section.display_limit });
  if (!items.length) return null;

  return {
    id: section.id,
    title: section.title,
    slug: section.slug,
    type: section.type,
    position: section.position ?? 0,
    active: Boolean(section.active),
    sourceType: section.source_type,
    sourceId: section.source_id,
    layoutVariant: section.layout_variant,
    displayLimit: section.display_limit,
    showCollectionBanner: Boolean(section.show_collection_banner),
    collection,
    items,
    updatedAt: section.updated_at ?? undefined,
  };
}

export async function getCollectionsForBrowse() {
  return getPublishedCollections();
}

export async function getCollectionPreview(collectionId: string) {
  const [collection, items] = await Promise.all([
    getCollectionById(collectionId, { includeDrafts: true }),
    getCollectionItems(collectionId, { includeDrafts: true }),
  ]);
  return { collection, items };
}
