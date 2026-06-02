import { AppShell } from "@/components/layout/AppShell";
import { ContinueWatchingCard } from "@/components/movie/ContinueWatchingCard";
import { HeroFeature } from "@/components/movie/HeroFeature";
import { MovieRail } from "@/components/movie/MovieRail";
import { PersonalizedSection } from "@/components/recommendation/PersonalizedSection";
import { getCatalogMovies, getFeaturedMovie, getRails } from "@/services/catalog-service";
import { getPersonalizedSections } from "@/services/recommendation/recommendation-engine";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";
import { getFavoriteMovieIds, getWatchProgressItems } from "@/services/user-library-service";

function getSearchValue(params: { [key: string]: string | string[] | undefined }) {
  const value = params.q;
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function matchesQuery(text: string, query: string) {
  return text.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = getSearchValue(await searchParams);
  const [featured, rails, favoriteIds, continueWatching, catalog, intelligenceRows] = await Promise.all([
    getFeaturedMovie(),
    getRails(),
    getFavoriteMovieIds(),
    getWatchProgressItems(),
    getCatalogMovies(),
    getPersonalizedSections(),
  ]);
  const settings = await getPublicSettings();
  const showRecommendations = getSettingValue(settings, "browse.showRecommendations", true);
  const showContinueWatching = getSettingValue(settings, "browse.showContinueWatching", true);
  const showRating = getSettingValue(settings, "browse.showRating", true);
  const showDuration = getSettingValue(settings, "browse.showDuration", true);
  const showGenres = getSettingValue(settings, "browse.showGenres", true);
  const showFavoriteButton = getSettingValue(settings, "player.showFavoriteButton", true);
  const posterFallbackUrl = getSettingValue(settings, "identity.posterFallbackUrl", "");
  const movies = catalog.filter((movie) => movie.type === "movie");
  const series = catalog.filter((movie) => movie.type === "series");
  const searchResults = query
    ? catalog.filter((movie) =>
        [
          movie.title,
          movie.description,
          movie.releaseYear.toString(),
          movie.genres.map((genre) => genre.name).join(" "),
        ].some((item) => matchesQuery(item, query)),
      )
    : [];

  return (
    <AppShell searchQuery={query}>
      <HeroFeature
        backdropFallbackUrl={getSettingValue(settings, "identity.backdropFallbackUrl", "")}
        favoriteIds={favoriteIds}
        heroRotating={getSettingValue(settings, "browse.heroRotating", true)}
        heroRotationMs={getSettingValue(settings, "browse.heroRotationMs", 8500)}
        movie={featured}
        movies={catalog}
        showFavoriteButton={showFavoriteButton}
        showTrailerButton={getSettingValue(settings, "player.showTrailerButton", true)}
      />
      <main className="relative z-10 mx-auto max-w-[1920px] space-y-8 px-5 pb-24 pt-7 md:px-10 md:pt-8 xl:space-y-8 xl:px-16 xl:pt-8 2xl:px-20">
        {query ? (
          <section className="rounded-xl border border-white/10 bg-black/44 p-4 shadow-[0_24px_90px_rgba(0,0,0,.35)] backdrop-blur-xl md:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cinema-cyan">Busca Cinema OS</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Resultados para &quot;{query}&quot;</h2>
              </div>
              <p className="text-sm text-cinema-muted">{searchResults.length} encontrados</p>
            </div>
            {searchResults.length ? (
              <MovieRail favoriteIds={favoriteIds} movies={searchResults} title="Encontrados no MaxCinema" />
            ) : (
              <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.03] p-8 text-sm text-cinema-muted">
                Nenhum conteudo encontrado. Tente buscar por genero, titulo ou ano.
              </div>
            )}
          </section>
        ) : null}

        {showContinueWatching && continueWatching.length ? (
          <section
            className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/42 p-3 shadow-[0_22px_80px_rgba(0,0,0,.34)] backdrop-blur-xl md:w-fit md:max-w-full md:p-4 xl:max-w-[920px]"
            id="continuar"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-white md:text-xl">Continuar assistindo</h2>
              <span className="text-xs font-medium text-white/48">Retomar</span>
            </div>
            <div className="flex max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {continueWatching.map(({ item, movie }) => (
                <ContinueWatchingCard key={item.movieId} movie={movie} progress={item} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="space-y-11 lg:space-y-14 xl:space-y-12">
          {showRecommendations ? <PersonalizedSection favoriteIds={favoriteIds} rows={intelligenceRows.slice(0, 2)} /> : null}

          {movies.length ? (
            <div id="filmes">
              <MovieRail favoriteIds={favoriteIds} movies={movies} posterFallbackUrl={posterFallbackUrl} showDuration={showDuration} showFavoriteButton={showFavoriteButton} showGenres={showGenres} showRating={showRating} title="Filmes no MaxCinema" />
            </div>
          ) : null}

          {series.length ? (
            <div id="series">
              <MovieRail favoriteIds={favoriteIds} movies={series} posterFallbackUrl={posterFallbackUrl} showDuration={showDuration} showFavoriteButton={showFavoriteButton} showGenres={showGenres} showRating={showRating} title="Series no MaxCinema" />
            </div>
          ) : null}

          {rails.map((rail) => (
            <div id={rail.title.includes("Originais") ? "originais" : undefined} key={rail.title}>
              <MovieRail
                accentColor={rail.accentColor}
                bannerUrl={rail.bannerUrl}
                favoriteIds={favoriteIds}
                movies={rail.movies}
                posterFallbackUrl={posterFallbackUrl}
                showCollectionBanner={rail.showCollectionBanner}
                showDuration={showDuration}
                showFavoriteButton={showFavoriteButton}
                showGenres={showGenres}
                showRating={showRating}
                subtitle={rail.subtitle}
                title={rail.title}
              />
            </div>
          ))}

          {showRecommendations ? <PersonalizedSection favoriteIds={favoriteIds} rows={intelligenceRows.slice(2)} /> : null}
        </div>
      </main>
    </AppShell>
  );
}
