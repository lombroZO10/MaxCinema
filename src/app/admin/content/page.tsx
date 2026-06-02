import { ContentHub } from "@/components/admin/content/ContentHub";
import { getAdminContentIndex } from "@/services/admin/admin-content-index-service";

export default async function AdminContentPage() {
  const index = await getAdminContentIndex();

  return (
    <ContentHub items={index.items} />
  );
}
