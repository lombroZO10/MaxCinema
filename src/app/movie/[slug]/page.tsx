import { notFound } from "next/navigation";
import { DetailView } from "@/components/movie/DetailView";
import { getMovieBySlug } from "@/services/catalog-service";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  return <DetailView movie={movie} />;
}
