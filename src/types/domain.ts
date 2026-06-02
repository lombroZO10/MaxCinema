export type ContentType = "movie" | "series";
export type ContentStatus = "draft" | "published";
export type UserRole = "owner" | "admin" | "editor" | "moderator" | "user";
export type ViewerProfileType = "adult" | "kids";

export type Genre = {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
};

export type CollectionType =
  | "manual"
  | "dynamic"
  | "seasonal"
  | "top_10"
  | "originals"
  | "trending"
  | "recommended"
  | "editorial";

export type CollectionStatus = "draft" | "published" | "archived" | "scheduled";
export type CollectionVisibility = "public" | "hidden" | "members_only" | "kids";

export type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  bannerUrl?: string;
  coverUrl?: string;
  accentColor: string;
  icon: string;
  type: CollectionType;
  status: CollectionStatus;
  visibility: CollectionVisibility;
  sortOrder: number;
  isFeatured: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  movie: Movie;
  position: number;
  note?: string;
  pinned: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
};

export type HomeSectionSourceType = "manual" | "collection" | "dynamic";

export type HomeSectionWithItems = {
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
  collection?: Collection | null;
  items: CollectionItem[];
  updatedAt?: string;
};

export type Episode = {
  id: string;
  seasonId: string;
  title: string;
  description: string;
  episodeNumber: number;
  durationMinutes: number;
  posterUrl: string;
  muxPlaybackId?: string;
  status?: ContentStatus;
  sortOrder?: number;
  publishedAt?: string;
};

export type Season = {
  id: string;
  movieId: string;
  seasonNumber: number;
  title: string;
  description: string;
  episodes: Episode[];
  status?: ContentStatus;
  sortOrder?: number;
  publishedAt?: string;
};

export type Movie = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: ContentType;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  muxPlaybackId?: string;
  releaseYear: number;
  durationMinutes: number;
  maturityRating: string;
  featured: boolean;
  status: ContentStatus;
  rating: number;
  cast: string[];
  genres: Genre[];
  seasons?: Season[];
};

export type WatchProgress = {
  movieId: string;
  progressSeconds: number;
  durationSeconds: number;
  label: string;
};

export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  status?: "active" | "blocked" | "invited";
  blockedAt?: string;
  lastSeenAt?: string;
  plan: string;
};

export type ViewerProfile = {
  id: string;
  accountId: string;
  userId: string;
  name: string;
  avatarUrl: string;
  profileType: ViewerProfileType;
  themeColor: string;
  language: string;
  maturityLimit: string;
  autoplayEnabled: boolean;
  trailerAutoplayEnabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};
