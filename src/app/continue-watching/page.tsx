import { AppShell } from "@/components/layout/AppShell";
import { ContinueWatchingCard } from "@/components/movie/ContinueWatchingCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";
import { getWatchProgressItems } from "@/services/user-library-service";
import { redirect } from "next/navigation";

export default async function ContinueWatchingPage() {
  const [settings, items] = await Promise.all([getPublicSettings(), getWatchProgressItems()]);
  if (!getSettingValue(settings, "browse.showContinueWatching", true)) redirect("/browse");

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <SectionTitle title="Continuar assistindo" />
        {items.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map(({ item, movie }) => {
              return <ContinueWatchingCard key={item.movieId} movie={movie} progress={item} />;
            })}
          </div>
        ) : (
          <EmptyState description="Quando voce assistir algum conteudo, o progresso aparecera aqui." title="Nada em andamento" />
        )}
      </main>
    </AppShell>
  );
}
