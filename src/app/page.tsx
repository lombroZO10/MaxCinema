import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MovieRail } from "@/components/movie/MovieRail";
import { getFeaturedMovie, getRails } from "@/services/content-service";

export default function LandingPage() {
  const featured = getFeaturedMovie();
  const rails = getRails();

  return (
    <main className="cinema-bg min-h-screen overflow-hidden">
      <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between px-5 backdrop-blur md:px-10">
        <div className="text-2xl font-semibold text-white">MaxCinema</div>
        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          <a href="#catalogo">Catalogo</a>
          <a href="#cinema-os">Cinema OS 2026</a>
          <a href="/login">Entrar</a>
        </nav>
        <Button href="/register" variant="secondary">
          Comecar
        </Button>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden">
        <img alt="" className="absolute inset-0 h-full w-full object-cover" src={featured.backdropUrl} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.88)_40%,rgba(3,6,9,.38)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-5 pb-24 pt-28 md:px-10">
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.95] text-white md:text-8xl">
            MaxCinema
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-cinema-muted">
            Uma plataforma de streaming premium com identidade propria, interface Cinema OS 2026 e base pronta para Supabase, Mux e assinaturas.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/browse" icon={<Play size={18} fill="currentColor" />}>
              Ver plataforma
            </Button>
            <Button href="/login" icon={<ArrowRight size={18} />} variant="secondary">
              Entrar
            </Button>
          </div>
          <div className="mt-16 grid max-w-3xl gap-3 md:grid-cols-3">
            {["Streaming HLS futuro", "Supabase Auth/Postgres", "Design system modular"].map((item) => (
              <div className="glass rounded-lg px-4 py-3 text-sm text-white/78" key={item}>
                <Sparkles className="mb-3 text-cinema-cyan" size={18} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-10" id="catalogo">
        <MovieRail movies={rails[0].movies} title="Primeira amostra do catalogo" />
      </section>
    </main>
  );
}
