import { AppShell } from "@/components/layout/AppShell";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { getCollectionsForBrowse } from "@/services/collections/collection-service";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";
import { redirect } from "next/navigation";

function getSearchValue(params: { [key: string]: string | string[] | undefined }) {
  const value = params.q;
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

export default async function BrowseCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = getSearchValue(await searchParams);
  const settings = await getPublicSettings();
  const showCollections = getSettingValue(settings, "browse.showCollections", true);
  if (!showCollections) redirect("/browse");

  const collections = await getCollectionsForBrowse();
  const siteName = getSettingValue(settings, "general.siteName", "MaxCinema");
  const filtered = query
    ? collections.filter((c) => `${c.title} ${c.description} ${c.shortDescription}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))
    : collections;

  return (
    <AppShell searchQuery={query}>
      <main className="relative z-10 mx-auto max-w-[1920px] space-y-8 px-5 pb-24 pt-10 md:px-10 xl:px-16 2xl:px-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cinema-cyan">Curadoria</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Colecoes</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cinema-muted">
              Vitrines editoriais do {siteName}: selecoes, rankings e curadorias especiais.
            </p>
          </div>
          <p className="text-sm text-cinema-muted">{filtered.length} colecoes</p>
        </header>

        {filtered.length ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-white/14 bg-white/[0.03] p-10 text-sm text-cinema-muted">
            Nenhuma colecao encontrada.
          </div>
        )}
      </main>
    </AppShell>
  );
}
