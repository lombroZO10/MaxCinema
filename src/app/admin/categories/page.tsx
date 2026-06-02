import { CurationCenter } from "@/components/admin/categories/CurationCenter";
import { getAdminCurationIndex } from "@/services/admin/admin-curation-service";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const index = await getAdminCurationIndex();
  return <CurationCenter error={error} index={index} />;
}
