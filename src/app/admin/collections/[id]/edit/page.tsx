import { CollectionEditor } from "@/components/admin/collections/CollectionEditor";
import { getCatalogMovies } from "@/services/catalog-service";
import { getCollectionById, getCollectionItems } from "@/services/collections/collection-service";

export default async function AdminCollectionEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [collection, items, catalog] = await Promise.all([
    getCollectionById(id, { includeDrafts: true }),
    getCollectionItems(id, { includeDrafts: true }),
    getCatalogMovies({ includeDrafts: true }),
  ]);

  if (!collection) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.045] p-6 text-white/70">
        Colecao nao encontrada.
      </div>
    );
  }

  return <CollectionEditor catalog={catalog} collection={collection} error={error} items={items} />;
}

