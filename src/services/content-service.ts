import type { Genre, Movie, Profile, WatchProgress } from "@/types/domain";

export const genres: Genre[] = [
  { id: "g1", name: "Sci-fi", slug: "sci-fi" },
  { id: "g2", name: "Drama", slug: "drama" },
  { id: "g3", name: "Acao", slug: "acao" },
  { id: "g4", name: "Suspense", slug: "suspense" },
  { id: "g5", name: "Original", slug: "original" },
  { id: "g6", name: "Fantasia", slug: "fantasia" },
];

const image = (id: string, w = 1200, h = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=86`;

export const movies: Movie[] = [
  {
    id: "m-eclipse",
    title: "Eclipse Protocol",
    slug: "eclipse-protocol",
    description:
      "No limite entre luz e sombra, uma arquiteta de mundos digitais descobre que a cidade orbital que protege e uma simulacao viva prestes a colapsar.",
    type: "movie",
    posterUrl: image("photo-1534447677768-be436bb09401"),
    backdropUrl: image("photo-1519608487953-e999c86e7455", 2200, 1200),
    trailerUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    muxPlaybackId: "future-eclipse-playback",
    releaseYear: 2026,
    durationMinutes: 132,
    maturityRating: "14",
    featured: true,
    status: "published",
    rating: 9.4,
    cast: ["Lia Duarte", "Marco Verne", "Sofia Kael"],
    genres: [genres[0], genres[3], genres[4]],
  },
  {
    id: "m-lumen",
    title: "Lumen District",
    slug: "lumen-district",
    description:
      "Um detetive sem memoria atravessa uma metropole iluminada por anuncios vivos para encontrar a unica lembranca que nao foi vendida.",
    type: "series",
    posterUrl: image("photo-1519608487953-e999c86e7455"),
    backdropUrl: image("photo-1493246507139-91e8fad9978e", 2200, 1200),
    releaseYear: 2025,
    durationMinutes: 48,
    maturityRating: "16",
    featured: false,
    status: "published",
    rating: 8.9,
    cast: ["Nina Prado", "Andre Voss", "Theo Madsen"],
    genres: [genres[1], genres[3], genres[5]],
    seasons: [
      {
        id: "s-lumen-1",
        movieId: "m-lumen",
        seasonNumber: 1,
        title: "Temporada 1",
        description: "A cidade acende. As memórias somem.",
        episodes: [
          {
            id: "e-lumen-1",
            seasonId: "s-lumen-1",
            title: "Rua Azul",
            description: "Um arquivo perdido aponta para o subsolo da cidade.",
            episodeNumber: 1,
            durationMinutes: 48,
            posterUrl: image("photo-1519608487953-e999c86e7455", 900, 520),
          },
          {
            id: "e-lumen-2",
            seasonId: "s-lumen-1",
            title: "Neon Frio",
            description: "A investigacao chega ao Ministerio das Vozes.",
            episodeNumber: 2,
            durationMinutes: 51,
            posterUrl: image("photo-1500530855697-b586d89ba3ee", 900, 520),
          },
        ],
      },
    ],
  },
  {
    id: "m-black-tide",
    title: "Mare Negra",
    slug: "mare-negra",
    description:
      "Um farol isolado no Atlantico recebe sinais impossiveis de uma expedicao desaparecida ha trinta anos.",
    type: "movie",
    posterUrl: image("photo-1500530855697-b586d89ba3ee"),
    backdropUrl: image("photo-1439405326854-014607f694d7", 2200, 1200),
    releaseYear: 2026,
    durationMinutes: 118,
    maturityRating: "14",
    featured: false,
    status: "published",
    rating: 8.6,
    cast: ["Iris Valen", "Caio Nobre", "Marta Sol"],
    genres: [genres[2], genres[3], genres[4]],
  },
  {
    id: "m-atlas",
    title: "Codigo Atlas",
    slug: "codigo-atlas",
    description:
      "Uma equipe encontra um mapa que reorganiza continentes em tempo real e vira alvo de governos que querem controlar o futuro.",
    type: "movie",
    posterUrl: image("photo-1519681393784-d120267933ba"),
    backdropUrl: image("photo-1519681393784-d120267933ba", 2200, 1200),
    releaseYear: 2024,
    durationMinutes: 126,
    maturityRating: "12",
    featured: false,
    status: "published",
    rating: 8.1,
    cast: ["Ravi Amon", "Helena Zhou", "Bruno Kiel"],
    genres: [genres[0], genres[2]],
  },
  {
    id: "m-iron-veil",
    title: "Véu de Ferro",
    slug: "veu-de-ferro",
    description:
      "Em um reino industrial, uma rainha exilada negocia com maquinas antigas para recuperar uma coroa feita de tempestades.",
    type: "series",
    posterUrl: image("photo-1500534314209-a25ddb2bd429"),
    backdropUrl: image("photo-1500534314209-a25ddb2bd429", 2200, 1200),
    releaseYear: 2026,
    durationMinutes: 55,
    maturityRating: "16",
    featured: false,
    status: "published",
    rating: 9.1,
    cast: ["Aline Hart", "Davi Oren", "Mel Kiro"],
    genres: [genres[5], genres[1], genres[4]],
  },
  {
    id: "m-solaris",
    title: "Solaris Nine",
    slug: "solaris-nine",
    description:
      "Pilotos de resgate entram em uma estacao solar onde cada corredor parece repetir uma versao diferente do mesmo acidente.",
    type: "movie",
    posterUrl: image("photo-1446776811953-b23d57bd21aa"),
    backdropUrl: image("photo-1446776811953-b23d57bd21aa", 2200, 1200),
    releaseYear: 2025,
    durationMinutes: 109,
    maturityRating: "12",
    featured: false,
    status: "published",
    rating: 8.4,
    cast: ["Eva Torres", "Jonas Cruz", "Mila Ander"],
    genres: [genres[0], genres[2]],
  },
  {
    id: "m-archive",
    title: "Arquivo Zero",
    slug: "arquivo-zero",
    description:
      "Uma restauradora de filmes encontra frames de pessoas que ainda nao nasceram em uma pelicula perdida de 1928.",
    type: "movie",
    posterUrl: image("photo-1485846234645-a62644f84728"),
    backdropUrl: image("photo-1485846234645-a62644f84728", 2200, 1200),
    releaseYear: 2023,
    durationMinutes: 101,
    maturityRating: "14",
    featured: false,
    status: "published",
    rating: 7.9,
    cast: ["Tais Moreno", "Igor Feld", "Noah Sil"],
    genres: [genres[1], genres[3]],
  },
  {
    id: "m-last-lighthouse",
    title: "O Ultimo Farol",
    slug: "o-ultimo-farol",
    description:
      "Apos o desaparecimento do litoral, um velho faroleiro guia navios por memorias projetadas no nevoeiro.",
    type: "movie",
    posterUrl: image("photo-1500530855697-b586d89ba3ee"),
    backdropUrl: image("photo-1507525428034-b723cf961d3e", 2200, 1200),
    releaseYear: 2026,
    durationMinutes: 114,
    maturityRating: "10",
    featured: false,
    status: "published",
    rating: 8.7,
    cast: ["Oscar Lima", "Clara Voss", "Nuno Reis"],
    genres: [genres[1], genres[4]],
  },
];

export const profile: Profile = {
  id: "p1",
  userId: "mock-user",
  fullName: "Lucas Almeida",
  avatarUrl: image("photo-1500648767791-00dcc994a43e", 200, 200),
  role: "admin",
  plan: "Plano Premium",
};

export const progress: WatchProgress[] = [
  { movieId: "m-lumen", progressSeconds: 1620, durationSeconds: 2880, label: "S1 E2 - 21m restantes" },
  { movieId: "m-black-tide", progressSeconds: 1800, durationSeconds: 7080, label: "1h 28m restantes" },
  { movieId: "m-atlas", progressSeconds: 2900, durationSeconds: 7560, label: "1h 18m restantes" },
];

export function getFeaturedMovie() {
  return movies.find((movie) => movie.featured) ?? movies[0];
}

export function getMovieBySlug(slug: string) {
  return movies.find((movie) => movie.slug === slug);
}

export function getMovieById(id: string) {
  return movies.find((movie) => movie.id === id);
}

export function getRails() {
  return [
    { title: "Populares no MaxCinema", movies: movies.slice(1, 8) },
    { title: "Originais MaxCinema", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "original")) },
    { title: "Lancamentos", movies: [...movies].sort((a, b) => b.releaseYear - a.releaseYear) },
    { title: "Sci-fi de alto impacto", movies: movies.filter((movie) => movie.genres.some((genre) => genre.slug === "sci-fi")) },
  ];
}

export function getRelatedMovies(movieId: string) {
  return movies.filter((movie) => movie.id !== movieId).slice(0, 6);
}
