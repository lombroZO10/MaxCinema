import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFeaturedMovie as getMockFeaturedMovie,
  getMovieById as getMockMovieById,
  getMovieBySlug as getMockMovieBySlug,
  getRails as getMockRails,
  movies as mockMovies,
} from "@/services/content-service";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { getBrowseSettings, getSettingValue } from "@/services/settings/settings-service";
import type { Movie } from "@/types/domain";
import { filterMoviesForViewerProfile, isAllowedForViewerProfile } from "@/utils/maturity";

type MovieRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
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
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

type EditorialMovieRow = MovieRow & {
  movie_genres?: { genres: { id: string; name: string; slug: string } | null }[];
};

type HomeSectionRow = {
  id: string;
  title: string;
  slug: string;
  type: string;
  active: boolean;
  source_type: "manual" | "collection" | "dynamic" | null;
  source_id: string | null;
  layout_variant: string | null;
  display_limit: number | null;
  show_collection_banner: boolean | null;
  home_section_items?: {
    position: number | null;
    movies: EditorialMovieRow | EditorialMovieRow[] | null;
  }[];
};

type CollectionRailRow = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_url: string | null;
  accent_color: string | null;
  status: "draft" | "published" | "archived" | "scheduled";
  visibility: "public" | "hidden" | "members_only" | "kids";
  starts_at: string | null;
  ends_at: string | null;
};

type CollectionRailItemRow = {
  position: number | null;
  pinned: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  movies: EditorialMovieRow | EditorialMovieRow[] | null;
};

export type CatalogRail = {
  title: string;
  movies: Movie[];
  subtitle?: string;
  bannerUrl?: string;
  accentColor?: string;
  layoutVariant?: string | null;
  showCollectionBanner?: boolean;
};

function mapMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
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
    rating: row.rating ?? 8.8,
    cast: [],
    genres:
      row.movie_genres
        ?.map((item) => item.genres)
        .filter((genre): genre is NonNullable<typeof genre> => Boolean(genre)) ?? [],
  };
}

async function fetchMoviesFromSupabase({ includeDrafts = false } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("movies")
    .select("*, movie_genres(genres(id, name, slug))")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapMovie(row as MovieRow));
}

export async function getCatalogMovies({ includeDrafts = false } = {}) {
  const activeProfile = await getActiveViewerProfile();
  if (!hasSupabaseEnv()) return filterMoviesForViewerProfile(mockMovies, activeProfile);

  try {
    const movies = await fetchMoviesFromSupabase({ includeDrafts });
    const catalog = movies.length ? movies : mockMovies;
    return includeDrafts ? catalog : filterMoviesForViewerProfile(catalog, activeProfile);
  } catch {
    return filterMoviesForViewerProfile(mockMovies, activeProfile);
  }
}

export async function getFeaturedMovie() {
  const activeProfile = await getActiveViewerProfile();
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: section } = await supabase
        .from("home_sections")
        .select("id, source_type, source_id")
        .eq("active", true)
        .eq("type", "hero")
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      const heroSection = section as { id: string; source_type: "manual" | "collection" | "dynamic" | null; source_id: string | null } | null;
      let heroMovieId: string | null = null;

      if (heroSection?.source_type === "collection" && heroSection.source_id) {
        const { data: item } = await supabase
          .from("collection_items")
          .select("movie_id")
          .eq("collection_id", heroSection.source_id)
          .order("pinned", { ascending: false })
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle();
        heroMovieId = (item as { movie_id?: string | null } | null)?.movie_id ?? null;
      } else if (heroSection?.id) {
        const { data: item } = await supabase
          .from("home_section_items")
          .select("movie_id")
          .eq("section_id", heroSection.id)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle();
        heroMovieId = (item as { movie_id?: string | null } | null)?.movie_id ?? null;
      }

      if (heroMovieId) {
        const movies = await fetchMoviesFromSupabase({ includeDrafts: false });
        const heroMovie = movies.find((movie) => movie.id === heroMovieId);
        if (heroMovie && isAllowedForViewerProfile(heroMovie, activeProfile)) return heroMovie;
      }
    } catch {
      // Fall back to featured catalog content.
    }
  }

  const movies = await getCatalogMovies();
  return movies.find((movie) => movie.featured) ?? movies[0] ?? getMockFeaturedMovie();
}

export async function getMovieBySlug(slug: string) {
  const activeProfile = await getActiveViewerProfile();
  if (!hasSupabaseEnv()) {
    const movie = getMockMovieBySlug(slug);
    return movie && isAllowedForViewerProfile(movie, activeProfile) ? movie : undefined;
  }
  const movies = await getCatalogMovies({ includeDrafts: true });
  const movie = movies.find((item) => item.slug === slug) ?? getMockMovieBySlug(slug);
  return movie && isAllowedForViewerProfile(movie, activeProfile) ? movie : undefined;
}

export async function getMovieById(id: string) {
  const activeProfile = await getActiveViewerProfile();
  if (!hasSupabaseEnv()) {
    const movie = getMockMovieById(id);
    return movie && isAllowedForViewerProfile(movie, activeProfile) ? movie : undefined;
  }
  const movies = await getCatalogMovies({ includeDrafts: true });
  const movie = movies.find((item) => item.id === id) ?? getMockMovieById(id);
  return movie && isAllowedForViewerProfile(movie, activeProfile) ? movie : undefined;
}

export async function getRails(): Promise<CatalogRail[]> {
  const [movies, activeProfile, browseSettings] = await Promise.all([
    getCatalogMovies(),
    getActiveViewerProfile(),
    getBrowseSettings(),
  ]);
  const cardsPerSection = getSettingValue(browseSettings, "browse.cardsPerSection", 12);
  const hideEmptySections = getSettingValue(browseSettings, "browse.hideEmptySections", true);
  const showOriginals = getSettingValue(browseSettings, "browse.showOriginals", true);

  if (!hasSupabaseEnv()) {
    return getMockRails().map((rail) => ({ ...rail, movies: rail.movies.slice(0, cardsPerSection) }));
  }

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
        home_section_items(
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
            status,
            movie_genres(genres(id, name, slug))
          )
        )
      `)
      .eq("active", true)
      .neq("type", "hero")
      .order("position", { ascending: true });

    if (!error && data?.length) {
      const editorialRails = await Promise.all(
        ((data ?? []) as unknown as HomeSectionRow[]).map(async (section): Promise<CatalogRail> => {
          const sourceType = section.source_type ?? "manual";
          const sourceId = section.source_id ?? undefined;

          // Collection-backed rails: source of truth is collections.collection_items.
          if (sourceType === "collection" || section.type === "collection") {
            if (!sourceId) return { title: section.title, movies: [] as Movie[] };

            const { data: collectionRow, error: collectionError } = await supabase
              .from("collections")
              .select("id, title, description, short_description, banner_url, accent_color, status, visibility, starts_at, ends_at")
              .eq("id", sourceId)
              .eq("status", "published")
              .eq("visibility", "public")
              .maybeSingle();

            const collection = collectionRow as CollectionRailRow | null;
            const now = Date.now();
            const starts = collection?.starts_at ? new Date(collection.starts_at).getTime() : null;
            const ends = collection?.ends_at ? new Date(collection.ends_at).getTime() : null;
            if (collectionError || !collection || (starts && now < starts) || (ends && now > ends)) {
              return { title: section.title, movies: [] as Movie[] };
            }

            const { data: items, error: itemsError } = await supabase
              .from("collection_items")
              .select(
                `
                position,
                pinned,
                starts_at,
                ends_at,
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
                  status,
                  movie_genres(genres(id, name, slug))
                )
              `,
              )
              .eq("collection_id", sourceId)
              .order("pinned", { ascending: false })
              .order("position", { ascending: true });

            if (itemsError || !items?.length) return { title: section.title, movies: [] as Movie[] };

            const sectionMovies = (items as unknown as CollectionRailItemRow[])
              .map((item) => {
                const movie = Array.isArray(item.movies) ? item.movies[0] : item.movies;
                return {
                  position: item.position ?? 0,
                  pinned: Boolean(item.pinned),
                  startsAt: item.starts_at,
                  endsAt: item.ends_at,
                  movie: movie ? mapMovie(movie) : null,
                };
              })
              .filter((item): item is { position: number; pinned: boolean; startsAt: string | null; endsAt: string | null; movie: Movie } => Boolean(item.movie))
              .filter((item) => item.movie.status === "published")
              .filter((item) => {
                const itemStarts = item.startsAt ? new Date(item.startsAt).getTime() : null;
                const itemEnds = item.endsAt ? new Date(item.endsAt).getTime() : null;
                return (!itemStarts || now >= itemStarts) && (!itemEnds || now <= itemEnds);
              })
              .filter((item) => isAllowedForViewerProfile(item.movie, activeProfile))
              .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.position - b.position)
              .slice(0, section.display_limit && section.display_limit > 0 ? section.display_limit : cardsPerSection)
              .map((item) => item.movie);

            return {
              title: section.title || collection.title,
              subtitle: collection.short_description ?? collection.description ?? undefined,
              movies: sectionMovies,
              bannerUrl: collection.banner_url ?? undefined,
              accentColor: collection.accent_color ?? undefined,
              layoutVariant: section.layout_variant,
              showCollectionBanner: Boolean(section.show_collection_banner),
            };
          }

          const sectionMovies = (section.home_section_items ?? [])
            .map((item) => {
              const movie = Array.isArray(item.movies) ? item.movies[0] : item.movies;
              return {
                position: item.position ?? 0,
                movie: movie ? mapMovie(movie) : null,
              };
            })
            .filter((item): item is { position: number; movie: Movie } => Boolean(item.movie))
            .filter((item) => item.movie.status === "published")
            .filter((item) => isAllowedForViewerProfile(item.movie, activeProfile))
            .sort((a, b) => a.position - b.position)
            .map((item) => item.movie)
            .slice(0, section.display_limit && section.display_limit > 0 ? section.display_limit : cardsPerSection);

          return { title: section.title, movies: sectionMovies };
        }),
      );
      const filteredRails = hideEmptySections ? editorialRails.filter((rail) => rail.movies.length) : editorialRails;

      if (filteredRails.length) return filteredRails;
    }
  } catch {
    // Fall through to generated rails.
  }

  return [
    { title: "Populares no MaxCinema", movies },
    showOriginals ? { title: "Originais MaxCinema", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "original")) } : null,
    { title: "Lancamentos", movies: [...movies].sort((a, b) => b.releaseYear - a.releaseYear) },
    { title: "Sci-fi de alto impacto", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "sci-fi")) },
  ]
    .filter((rail): rail is CatalogRail => Boolean(rail))
    .map((rail) => ({ ...rail, movies: rail.movies.slice(0, cardsPerSection) }))
    .filter((rail) => !hideEmptySections || rail.movies.length);
}
