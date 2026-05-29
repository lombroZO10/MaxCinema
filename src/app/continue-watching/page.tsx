import { AppShell } from "@/components/layout/AppShell";
import { ContinueWatchingCard } from "@/components/movie/ContinueWatchingCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { progress } from "@/services/content-service";
import { getMovieById } from "@/services/catalog-service";

export default async function ContinueWatchingPage() {
  const items = await Promise.all(
    progress.map(async (item) => ({ item, movie: await getMovieById(item.movieId) })),
  );

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <SectionTitle title="Continuar assistindo" />
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(({ item, movie }) => {
            return movie ? <ContinueWatchingCard key={item.movieId} movie={movie} progress={item} /> : null;
          })}
        </div>
      </main>
    </AppShell>
  );
}
