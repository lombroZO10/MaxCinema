import { CollectionManager } from "@/components/admin/collections/CollectionManager";
import { getCollections } from "@/services/collections/collection-service";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const collections = await getCollections({ includeDrafts: true });
  return <CollectionManager collections={collections} error={error} />;
}

