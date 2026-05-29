"use client";

import { ArrowLeft, Maximize, Pause, Play, Volume2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Movie } from "@/types/domain";

export function CinemaPlayer({ movie }: { movie: Movie }) {
  const [playing, setPlaying] = useState(false);
  const progress = useMemo(() => (playing ? 42 : 31), [playing]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 opacity-35">
        <img alt="" className="h-full w-full object-cover blur-sm" src={movie.backdropUrl} />
      </div>
      <div className="absolute inset-0 bg-black/72" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex h-20 items-center justify-between px-5 md:px-10">
          <Link className="inline-flex items-center gap-2 rounded-md bg-white/8 px-4 py-2 text-sm text-white/82 backdrop-blur hover:text-white" href={`/movie/${movie.slug}`}>
            <ArrowLeft size={18} />
            Voltar
          </Link>
          <div className="text-right">
            <p className="text-xs uppercase text-cinema-muted">Assistindo</p>
            <h1 className="font-semibold">{movie.title}</h1>
          </div>
        </header>

        <section className="grid flex-1 place-items-center px-5 pb-10">
          <div className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-xl border border-white/12 bg-black shadow-[0_40px_160px_rgba(0,0,0,.7)]">
            <img alt="" className="h-full w-full object-cover opacity-82" src={movie.backdropUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            <button
              aria-label={playing ? "Pausar" : "Reproduzir"}
              className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cinema-cyan text-slate-950 shadow-[0_0_60px_rgba(19,200,255,.55)] transition hover:scale-105"
              onClick={() => setPlaying((value) => !value)}
              type="button"
            >
              {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
            </button>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/18">
                <div className="h-full rounded-full bg-cinema-cyan" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-white/82">
                <div className="flex items-center gap-4">
                  <button className="grid size-10 place-items-center rounded-full bg-white/10" type="button">
                    {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  </button>
                  <Volume2 size={18} />
                  <span>Continua de {progress}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{movie.muxPlaybackId ? "Mux HLS pronto" : "Mux Playback ID futuro"}</span>
                  <Maximize size={18} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
