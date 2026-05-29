import { notFound } from "next/navigation";
import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import { getMovieById } from "@/services/catalog-service";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieById(id);
  if (!movie) notFound();

  return <CinemaPlayer movie={movie} />;
}
