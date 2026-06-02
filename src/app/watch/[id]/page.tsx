import { notFound } from "next/navigation";
import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import { getMovieById } from "@/services/catalog-service";
import { getSettingValue, getSettings } from "@/services/settings/settings-service";
import { getMovieProgress } from "@/services/user-library-service";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [movie, progress, settings] = await Promise.all([getMovieById(id), getMovieProgress(id), getSettings()]);
  if (!movie) notFound();

  return (
    <CinemaPlayer
      backdropFallbackUrl={getSettingValue(settings, "identity.backdropFallbackUrl", "")}
      initialProgressSeconds={progress?.progressSeconds ?? 0}
      movie={movie}
      saveWatchProgress={getSettingValue(settings, "player.saveWatchProgress", true)}
    />
  );
}
