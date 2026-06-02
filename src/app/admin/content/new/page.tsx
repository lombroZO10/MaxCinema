import { createMovieAction } from "@/app/admin/actions";
import { NewContentStudio } from "@/components/admin/content/NewContentStudio";

export default async function NewContentStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  void createMovieAction; // keep tree-shaking stable; action used in client component

  return <NewContentStudio error={error} />;
}
