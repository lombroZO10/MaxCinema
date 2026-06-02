import { ContentEditor } from "@/components/admin/content/ContentEditor";
import type { Movie } from "@/types/domain";

export function AdminMovieForm({
  action,
  movie,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  movie?: Movie;
  error?: string;
}) {
  return <ContentEditor action={action} error={error} movie={movie} />;
}
