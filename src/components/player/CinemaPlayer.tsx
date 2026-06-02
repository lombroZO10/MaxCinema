"use client";

import { ArrowLeft, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { sendRecommendationEvent } from "@/hooks/use-recommendation-event";
import { getMuxHlsUrl } from "@/lib/mux/playback";
import type { Movie } from "@/types/domain";

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function isHlsSource(sourceUrl: string) {
  return sourceUrl.includes(".m3u8") || sourceUrl.includes("manifest/video");
}

export function CinemaPlayer({
  movie,
  initialProgressSeconds = 0,
  saveWatchProgress = true,
  backdropFallbackUrl,
}: {
  movie: Movie;
  initialProgressSeconds?: number;
  saveWatchProgress?: boolean;
  backdropFallbackUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const appliedInitialProgressRef = useRef(false);
  const lastPersistedSecondRef = useRef(0);
  const currentTimeRef = useRef(Math.max(initialProgressSeconds, 0));
  const durationRef = useRef(Math.max(movie.durationMinutes * 60, 0));
  const [, startTransition] = useTransition();

  const sourceOptions = useMemo(() => {
    const options: Array<{ label: string; url: string }> = [];
    const muxUrl = getMuxHlsUrl(movie.muxPlaybackId);

    if (muxUrl) options.push({ label: "Mux HLS", url: muxUrl });
    if (movie.trailerUrl && !options.some((option) => option.url === movie.trailerUrl)) {
      options.push({ label: "Video URL", url: movie.trailerUrl });
    }

    return options;
  }, [movie.muxPlaybackId, movie.trailerUrl]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(Math.max(movie.durationMinutes * 60, 0));
  const [currentTime, setCurrentTime] = useState(Math.max(initialProgressSeconds, 0));
  const [volume, setVolume] = useState(0.82);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(sourceOptions.length > 0);
  const [error, setError] = useState<string | null>(null);

  const activeSource = sourceOptions[sourceIndex] ?? null;
  const sourceUrl = activeSource?.url ?? null;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSourceFailure = useCallback(
    (message: string) => {
      setPlaying(false);
      setLoading(false);
      setSourceIndex((currentIndex) => {
        if (currentIndex < sourceOptions.length - 1) {
          setError(null);
          setLoading(true);
          return currentIndex + 1;
        }

        setError(message);
        return currentIndex;
      });
    },
    [sourceOptions.length],
  );

  const persistProgress = useCallback(
    (progressSeconds = currentTimeRef.current, durationSeconds = durationRef.current) => {
      if (!saveWatchProgress || !sourceUrl || durationSeconds <= 0) return;

      const roundedProgress = Math.max(0, Math.floor(progressSeconds));
      const roundedDuration = Math.max(0, Math.floor(durationSeconds));

      startTransition(async () => {
        await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movie.id,
            progressSeconds: roundedProgress,
            durationSeconds: roundedDuration,
          }),
        });
      });
    },
    [movie.id, saveWatchProgress, sourceUrl],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let hls: import("hls.js").default | null = null;
    const videoSource = sourceUrl;
    const sourceIsHls = isHlsSource(videoSource);
    const mediaElement = video;

    async function setupVideoSource() {
      setError(null);
      setLoading(true);
      appliedInitialProgressRef.current = false;

      if (sourceIsHls) {
        if (mediaElement.canPlayType("application/vnd.apple.mpegurl")) {
          mediaElement.src = videoSource;
        } else {
          const Hls = (await import("hls.js")).default;
          if (cancelled) return;

          if (!Hls.isSupported()) {
            setError("Este navegador nao suporta HLS neste dispositivo.");
            setLoading(false);
            return;
          }

          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(videoSource);
          hls.attachMedia(mediaElement);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              handleSourceFailure("Nao foi possivel carregar o stream. Confira o Mux Playback ID ou a URL do video.");
            }
          });
        }
      } else {
        mediaElement.src = videoSource;
      }

      mediaElement.load();
    }

    setupVideoSource();

    return () => {
      cancelled = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [handleSourceFailure, sourceUrl]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onPageHide = () => persistProgress();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      persistProgress();
    };
  }, [persistProgress]);

  async function togglePlaying() {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    if (video.paused) {
      try {
        await video.play();
        await sendRecommendationEvent({
          movieId: movie.id,
          event: "play",
          sectionSlug: "player",
          metadata: {
            source: activeSource?.label ?? "unknown",
            currentTime: Math.floor(video.currentTime),
          },
        });
      } catch {
        setError("O navegador bloqueou a reproducao automatica. Toque em play novamente.");
      }
      return;
    }

    video.pause();
    persistProgress(video.currentTime, video.duration);
  }

  function seekTo(value: number) {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.min(Math.max(value, 0), duration || 0);
    video.currentTime = nextTime;
    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);
  }

  function skipBy(seconds: number) {
    seekTo((videoRef.current?.currentTime ?? currentTime) + seconds);
  }

  function updateVolume(value: number) {
    const nextVolume = Math.min(Math.max(value, 0), 1);
    const video = videoRef.current;
    if (video) {
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
    }
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
  }

  function toggleMuted() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current?.requestFullscreen();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 opacity-25">
        <img alt="" className="h-full w-full object-cover blur-md" src={movie.backdropUrl || backdropFallbackUrl} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(19,200,255,.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,.62),#000_78%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/42 px-4 py-2 text-sm text-white/82 backdrop-blur-xl transition hover:border-cinema-cyan/45 hover:text-white" href={`/movie/${movie.slug}`}>
            <ArrowLeft size={18} />
            Voltar
          </Link>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cinema-muted">MaxCinema Player</p>
            <h1 className="truncate text-sm font-semibold text-white md:text-base">{movie.title}</h1>
          </div>
        </header>

        <section className="grid flex-1 place-items-center px-3 pb-5 md:px-8 md:pb-8">
          <div ref={containerRef} className="group/player relative aspect-video w-full max-w-7xl overflow-hidden rounded-lg border border-white/12 bg-black shadow-[0_36px_180px_rgba(0,0,0,.82)]">
            {sourceUrl ? (
              <video
                className="h-full w-full bg-black object-contain"
                onCanPlay={() => setLoading(false)}
                onDurationChange={(event) => {
                  const nextDuration = event.currentTarget.duration || Math.max(movie.durationMinutes * 60, 0);
                  durationRef.current = nextDuration;
                  setDuration(nextDuration);
                }}
                onEnded={() => {
                  setPlaying(false);
                  persistProgress(videoRef.current?.duration ?? duration, videoRef.current?.duration ?? duration);
                }}
                onError={() => {
                  handleSourceFailure("Nao foi possivel reproduzir este video. Verifique se a URL e publica ou se o Playback ID do Mux esta correto.");
                }}
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  const realDuration = video.duration || Math.max(movie.durationMinutes * 60, 0);
                  durationRef.current = realDuration;
                  setDuration(realDuration);
                  video.volume = volume;
                  video.muted = muted;

                  if (!appliedInitialProgressRef.current && initialProgressSeconds > 0 && realDuration > initialProgressSeconds + 2) {
                    video.currentTime = initialProgressSeconds;
                    currentTimeRef.current = initialProgressSeconds;
                    setCurrentTime(initialProgressSeconds);
                    appliedInitialProgressRef.current = true;
                  }
                }}
                onPause={(event) => {
                  setPlaying(false);
                  persistProgress(event.currentTarget.currentTime, event.currentTarget.duration);
                }}
                onPlay={() => {
                  setError(null);
                  setPlaying(true);
                }}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  currentTimeRef.current = video.currentTime;
                  durationRef.current = video.duration || duration;
                  setCurrentTime(video.currentTime);
                  setDuration(video.duration || duration);

                  const roundedSecond = Math.floor(video.currentTime);
                  if (roundedSecond - lastPersistedSecondRef.current >= 15) {
                    lastPersistedSecondRef.current = roundedSecond;
                    persistProgress(video.currentTime, video.duration || duration);
                  }
                }}
                playsInline
                poster={movie.backdropUrl || backdropFallbackUrl}
                ref={videoRef}
              />
            ) : (
              <img alt="" className="h-full w-full object-cover opacity-70" src={movie.backdropUrl || backdropFallbackUrl} />
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/18 to-black/32" />

            {loading ? (
              <div className="absolute inset-0 grid place-items-center bg-black/25">
                <div className="size-14 animate-spin rounded-full border-2 border-white/12 border-t-cinema-cyan" />
              </div>
            ) : null}

            {!sourceUrl ? (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div className="max-w-lg rounded-xl border border-white/12 bg-black/62 p-6 backdrop-blur-2xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-cinema-cyan">Video nao configurado</p>
                  <h2 className="mt-3 text-2xl font-semibold">Este conteudo ainda nao tem fonte de reproducao.</h2>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    No Admin Studio, adicione um upload de video, uma URL publica em Trailer/Video URL ou um Mux Playback ID.
                  </p>
                  <Link className="mt-5 inline-flex rounded-full bg-cinema-cyan px-5 py-2 text-sm font-semibold text-slate-950" href={`/admin/content/${movie.id}/edit`}>
                    Abrir no admin
                  </Link>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="absolute left-1/2 top-8 w-[min(92%,560px)] -translate-x-1/2 rounded-lg border border-red-300/20 bg-red-500/12 px-4 py-3 text-center text-sm text-red-100 backdrop-blur-xl">
                {error}
              </div>
            ) : null}

            {sourceUrl ? (
              <button
                aria-label={playing ? "Pausar video" : "Reproduzir video"}
                className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-slate-950 shadow-[0_0_70px_rgba(19,200,255,.32)] transition hover:scale-105 md:size-20"
                onClick={togglePlaying}
                type="button"
              >
                {playing ? <Pause size={28} fill="currentColor" /> : <Play className="ml-1" size={30} fill="currentColor" />}
              </button>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 p-3 transition md:p-5">
              <div className="rounded-lg border border-white/10 bg-black/58 p-3 shadow-[0_18px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl md:p-4">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-xs tabular-nums text-white/70">{formatTime(currentTime)}</span>
                  <input
                    aria-label="Progresso do video"
                    className="player-range h-2 flex-1"
                    disabled={!sourceUrl || duration <= 0}
                    max={duration || 0}
                    min={0}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    style={{ background: `linear-gradient(90deg, #13c8ff ${progressPercent}%, rgba(255,255,255,.18) ${progressPercent}%)` }}
                    type="range"
                    value={Math.min(currentTime, duration || currentTime)}
                  />
                  <span className="w-12 text-right text-xs tabular-nums text-white/70">{formatTime(duration)}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-white/82">
                  <div className="flex items-center gap-2">
                    <button className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/18 disabled:opacity-40" disabled={!sourceUrl} onClick={togglePlaying} type="button">
                      {playing ? <Pause size={18} fill="currentColor" /> : <Play className="ml-0.5" size={18} fill="currentColor" />}
                    </button>
                    <button className="hidden size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/18 sm:grid" disabled={!sourceUrl} onClick={() => skipBy(-10)} type="button" aria-label="Voltar 10 segundos">
                      <RotateCcw size={17} />
                    </button>
                    <button className="hidden size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/18 sm:grid" disabled={!sourceUrl} onClick={() => skipBy(10)} type="button" aria-label="Avancar 10 segundos">
                      <RotateCw size={17} />
                    </button>
                    <div className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2">
                      <button aria-label={muted ? "Ativar volume" : "Silenciar"} disabled={!sourceUrl} onClick={toggleMuted} type="button">
                        {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input
                        aria-label="Volume"
                        className="player-range hidden h-1.5 w-20 sm:block"
                        disabled={!sourceUrl}
                        max={1}
                        min={0}
                        onChange={(event) => updateVolume(Number(event.target.value))}
                        step={0.01}
                        style={{ background: `linear-gradient(90deg, #ffffff ${muted ? 0 : volume * 100}%, rgba(255,255,255,.18) ${muted ? 0 : volume * 100}%)` }}
                        type="range"
                        value={muted ? 0 : volume}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/58 md:inline-flex">
                      {activeSource?.label ?? "Sem fonte"}
                    </span>
                    <button aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/18" onClick={toggleFullscreen} type="button">
                      {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
