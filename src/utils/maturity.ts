import type { Movie, ViewerProfile } from "@/types/domain";

const maturityRank = new Map<string, number>([
  ["l", 0],
  ["livre", 0],
  ["0", 0],
  ["10", 10],
  ["12", 12],
  ["14", 14],
  ["16", 16],
  ["18", 18],
]);

function normalizeRating(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").replace("+", "");
}

export function maturityValue(value: string) {
  return maturityRank.get(normalizeRating(value)) ?? 18;
}

export function isAllowedForViewerProfile(movie: Movie, profile: ViewerProfile | null) {
  if (!profile || profile.profileType !== "kids") return true;
  return maturityValue(movie.maturityRating) <= maturityValue(profile.maturityLimit);
}

export function filterMoviesForViewerProfile(movies: Movie[], profile: ViewerProfile | null) {
  return movies.filter((movie) => isAllowedForViewerProfile(movie, profile));
}
