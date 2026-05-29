import { AppShell } from "@/components/layout/AppShell";
import { ContinueWatchingCard } from "@/components/movie/ContinueWatchingCard";
import { HeroFeature } from "@/components/movie/HeroFeature";
import { MovieRail } from "@/components/movie/MovieRail";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { progress } from "@/services/content-service";
import { getFeaturedMovie, getMovieById, getRails } from "@/services/catalog-service";

export default async function BrowsePage() {
  const [featured, rails] = await Promise.all([getFeaturedMovie(), getRails()]);
  const continueWatching = await Promise.all(
    progress.map(async (item) => ({ item, movie: await getMovieById(item.movieId) })),
  );

  return (
    <AppShell>
      <HeroFeature movie={featured} />
      <main className="relative z-10 -mt-10 space-y-10 px-5 pb-20 md:-mt-40 md:px-10 lg:px-16">
        <section>
          <SectionTitle title="Continuar assistindo" />
          <div className="flex gap-4 overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {continueWatching.map(({ item, movie }) => {
              return movie ? <ContinueWatchingCard key={item.movieId} movie={movie} progress={item} /> : null;
            })}
          </div>
        </section>
        {rails.map((rail) => (
          <div id={rail.title.includes("Originais") ? "originais" : undefined} key={rail.title}>
            <MovieRail movies={rail.movies} title={rail.title} />
          </div>
        ))}
      </main>
    </AppShell>
  );
}
