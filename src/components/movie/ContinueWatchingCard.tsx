import { Play } from "lucide-react";
import Link from "next/link";
import type { Movie, WatchProgress } from "@/types/domain";
import { formatProgress } from "@/utils/format";

export function ContinueWatchingCard({
  movie,
  progress,
}: {
  movie: Movie;
  progress: WatchProgress;
}) {
  const percent = formatProgress(progress.progressSeconds, progress.durationSeconds);

  return (
    <Link
      className="group relative w-[292px] min-w-[292px] overflow-hidden rounded-lg border border-white/12 bg-white/6 shadow-[0_18px_56px_rgba(0,0,0,0.32)] md:w-[390px] md:min-w-[390px] xl:w-[340px] xl:min-w-[340px] 2xl:w-[360px] 2xl:min-w-[360px]"
      href={`/watch/${movie.id}`}
    >
      <div className="aspect-[16/8]">
        <img alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" src={movie.backdropUrl} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 xl:p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{movie.title}</h3>
          <p className="mt-1 text-xs text-cinema-muted">{progress.label}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/18">
            <div className="h-full rounded-full bg-cinema-cyan" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur xl:size-9">
          <Play size={16} fill="currentColor" />
        </span>
      </div>
    </Link>
  );
}
