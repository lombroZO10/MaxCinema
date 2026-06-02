import { notFound } from "next/navigation";
import { updateMovieAction } from "@/app/admin/actions";
import { ContentEditor } from "@/components/admin/content/ContentEditor";
import { AdminPreviewPanel } from "@/components/admin/content/AdminPreviewPanel";
import { getMovieById } from "@/services/catalog-service";

export default async function EditContentStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const movie = await getMovieById(id);
  if (!movie) notFound();

  const action = updateMovieAction.bind(null, id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <ContentEditor action={action} error={error} movie={movie} />
      <AdminPreviewPanel movie={movie} />
    </div>
  );
}
