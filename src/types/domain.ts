export type ContentType = "movie" | "series";
export type ContentStatus = "draft" | "published";
export type UserRole = "user" | "admin";

export type Genre = {
  id: string;
  name: string;
  slug: string;
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
};

export type Season = {
  id: string;
  movieId: string;
  seasonNumber: number;
  title: string;
  description: string;
  episodes: Episode[];
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
  plan: string;
};
