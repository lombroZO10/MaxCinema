import { AppShell } from "@/components/layout/AppShell";
import { MovieCard } from "@/components/movie/MovieCard";
import { getCollectionBySlug, getCollectionItems } from "@/services/collections/collection-service";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

const fallbackHero = "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1800&h=1000&q=86";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getPublicSettings();
  const siteName = getSettingValue(settings, "general.siteName", "MaxCinema");
  const collection = getSettingValue(settings, "browse.showCollections", true) ? await getCollectionBySlug(slug) : null;

  if (!collection) {
    return {
      title: `Colecao nao encontrada | ${siteName}`,
    };
  }

  return {
    title: `${collection.title} | ${siteName}`,
    description: collection.shortDescription || collection.description || `Colecao editorial do ${siteName}.`,
    openGraph: {
      title: collection.title,
      description: collection.shortDescription || collection.description,
      images: collection.bannerUrl || collection.coverUrl ? [collection.bannerUrl || collection.coverUrl || fallbackHero] : undefined,
    },
  };
}

export default async function BrowseCollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = (await searchParams).q;
  const q = Array.isArray(query) ? query[0] ?? "" : query ?? "";
  const settings = await getPublicSettings();
  if (!getSettingValue(settings, "browse.showCollections", true)) redirect("/browse");

  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    return (
      <AppShell searchQuery={q}>
        <main className="relative z-10 mx-auto max-w-[1920px] px-5 pb-24 pt-10 md:px-10 xl:px-16 2xl:px-20">
          <div className="rounded-xl border border-white/10 bg-black/44 p-8 text-cinema-muted">
            Colecao nao encontrada.
          </div>
        </main>
      </AppShell>
    );
  }

  const items = await getCollectionItems(collection.id);
  const movies = items.map((item) => item.movie);
  const filtered = q
    ? movies.filter((m) => `${m.title} ${m.description} ${m.releaseYear}`.toLocaleLowerCase("pt-BR").includes(q.toLocaleLowerCase("pt-BR")))
    : movies;

  const hero = collection.bannerUrl || collection.coverUrl || filtered[0]?.backdropUrl || filtered[0]?.posterUrl || fallbackHero;
  const posterFallbackUrl = getSettingValue(settings, "identity.posterFallbackUrl", "");
  const showRating = getSettingValue(settings, "browse.showRating", true);
  const showDuration = getSettingValue(settings, "browse.showDuration", true);
  const showGenres = getSettingValue(settings, "browse.showGenres", true);
  const showFavoriteButton = getSettingValue(settings, "player.showFavoriteButton", true);

  return (
    <AppShell searchQuery={q}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img alt="" className="h-full w-full object-cover opacity-90" src={hero} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_28%,rgba(3,6,9,.38)_58%,rgba(3,6,9,.12)_78%,rgba(3,6,9,.62)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.12)_0%,rgba(3,6,9,.08)_46%,#030609_100%)]" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[420px] max-w-[1920px] content-end gap-6 px-5 pb-14 pt-14 md:min-h-[460px] md:px-10 xl:min-h-[520px] xl:px-16 2xl:px-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.075] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/82 backdrop-blur">
              <span className="size-2 rounded-full" style={{ backgroundColor: collection.accentColor }} />
              Colecao
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-[0.95] text-white md:text-5xl xl:text-6xl">
              {collection.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
              {collection.description || collection.shortDescription}
            </p>
            <p className="mt-4 text-sm text-white/55">{movies.length} conteudos</p>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-[1920px] space-y-8 px-5 pb-24 pt-7 md:px-10 xl:px-16 2xl:px-20">
        {filtered.length ? (
          <section className="flex flex-wrap gap-4">
            {filtered.map((movie, index) => (
              <MovieCard
                key={movie.id}
                favorite={false}
                movie={movie}
                posterFallbackUrl={posterFallbackUrl}
                priority={index < 6}
                showDuration={showDuration}
                showFavoriteButton={showFavoriteButton}
                showGenres={showGenres}
                showRating={showRating}
              />
            ))}
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-white/14 bg-white/[0.03] p-10 text-sm text-cinema-muted">
            Nenhum conteudo encontrado nesta colecao.
          </div>
        )}
      </main>
    </AppShell>
  );
}
