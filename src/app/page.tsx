import {
  ArrowRight,
  BadgeDollarSign,
  ChevronRight,
  Clapperboard,
  Database,
  Film,
  Gauge,
  Layers3,
  LockKeyhole,
  Play,
  RadioTower,
  Server,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { movies } from "@/services/content-service";
import type { Movie } from "@/types/domain";
import { formatDuration } from "@/utils/format";

const featured = movies[0];
const catalog = movies.slice(0, 6);

const experience = [
  {
    title: "Interface imersiva",
    description: "Navegacao fluida, rails editoriais e uma home pensada para cinema, TV e mobile.",
    icon: Layers3,
  },
  {
    title: "Qualidade cinematografica",
    description: "Backdrops gigantes, posters verticais e detalhe visual preparado para conteudo premium.",
    icon: Clapperboard,
  },
  {
    title: "Curadoria inteligente",
    description: "Favoritos, continuar assistindo, originais e lancamentos com estrutura editorial.",
    icon: Sparkles,
  },
  {
    title: "Sincronia total",
    description: "Progresso de exibicao salvo e base pronta para HLS, Mux e Supabase.",
    icon: RadioTower,
  },
];

const stack = [
  {
    title: "Supabase",
    description: "Auth, Postgres, Storage, RLS e dados editoriais em uma base preparada para escala.",
    status: "Operacional",
    icon: Database,
    glow: "from-emerald-400/22",
  },
  {
    title: "Mux",
    description: "Playback ID e arquitetura prontos para streaming HLS profissional.",
    status: "Preparado",
    icon: Zap,
    glow: "from-cinema-magenta/22",
  },
  {
    title: "Storage",
    description: "Posters, backdrops, trailers e biblioteca de midia conectados ao fluxo admin.",
    status: "Operacional",
    icon: Server,
    glow: "from-cinema-cyan/22",
  },
  {
    title: "Billing",
    description: "Estrutura reservada para Stripe e Mercado Pago sem travar a evolucao do produto.",
    status: "Em breve",
    icon: BadgeDollarSign,
    glow: "from-cinema-amber/18",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-md border border-cinema-cyan/45 bg-cinema-cyan/12 text-cinema-cyan shadow-[0_0_24px_rgba(19,200,255,0.3)]">
        <Film size={19} />
      </span>
      <span>
        <span className="block text-lg font-semibold leading-none text-white">MaxCinema</span>
        <span className="mt-1 block text-xs font-semibold text-cinema-cyan">Cinema OS 2026</span>
      </span>
    </div>
  );
}

function PosterCard({ movie }: { movie: Movie }) {
  return (
    <Link
      className="group relative min-w-[176px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_20px_70px_rgba(0,0,0,0.42)] transition duration-500 hover:-translate-y-2 hover:border-cinema-cyan/45 hover:shadow-[0_0_50px_rgba(19,200,255,0.18)]"
      href={`/movie/${movie.slug}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          src={movie.posterUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/16 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-white/82">
            <span className="inline-flex items-center gap-1 text-cinema-amber">
              <Star size={13} fill="currentColor" />
              {movie.rating}
            </span>
            <span>{movie.releaseYear}</span>
            <span>{formatDuration(movie.durationMinutes)}</span>
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-cinema-muted">
            {movie.genres.map((genre) => genre.name).join(" / ")}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PlatformPreview() {
  return (
    <div className="relative rounded-xl border border-white/12 bg-black/34 p-3 shadow-[0_30px_110px_rgba(0,0,0,0.54)] backdrop-blur-xl">
      <div className="absolute -inset-px rounded-xl bg-[linear-gradient(120deg,rgba(19,200,255,.4),transparent_32%,rgba(224,76,255,.24),transparent_68%,rgba(255,159,67,.22))] opacity-50" />
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#030609]">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-58" src={featured.backdropUrl} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.9)_30%,rgba(3,6,9,.38)_100%)]" />
        <div className="relative grid min-h-[420px] grid-cols-1 lg:grid-cols-[210px_1fr]">
          <aside className="hidden border-r border-white/10 bg-black/32 p-5 lg:block">
            <BrandMark />
            <div className="mt-10 space-y-3 text-xs font-semibold text-white/58">
              {["Inicio", "Filmes", "Series", "Originais", "Minha lista", "Continuar"].map((item, index) => (
                <div
                  className={`rounded-md px-3 py-2 ${index === 0 ? "bg-cinema-cyan/12 text-cinema-cyan" : "bg-white/[0.03]"}`}
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="p-5 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="h-10 flex-1 rounded-md border border-white/10 bg-black/38 px-4 py-2 text-sm text-white/38">
                Buscar
              </div>
              <div className="grid size-10 place-items-center rounded-md border border-white/10 bg-black/38">
                <LockKeyhole size={16} />
              </div>
            </div>
            <div className="mt-14 max-w-xl">
              <p className="text-base font-semibold text-white">Em destaque</p>
              <h2 className="mt-3 text-4xl font-semibold leading-none text-white md:text-6xl">{featured.title}</h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-cinema-muted md:text-base">{featured.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="h-10 px-4" href={`/watch/${featured.id}`} icon={<Play size={16} fill="currentColor" />}>
                  Assistir agora
                </Button>
                <Button className="h-10 px-4" href={`/movie/${featured.slug}`} variant="secondary">
                  Mais detalhes
                </Button>
              </div>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {movies.slice(1, 4).map((movie) => (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black/36" key={movie.id}>
                  <img alt="" className="h-24 w-full object-cover" src={movie.backdropUrl} />
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</p>
                    <div className="mt-2 h-1 rounded-full bg-white/12">
                      <div className="h-full w-2/3 rounded-full bg-cinema-cyan" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-white">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/8 bg-black/24 px-5 py-4 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link href="/">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/68 md:flex">
            <a className="transition hover:text-white" href="#experiencia">Experiencia</a>
            <a className="transition hover:text-white" href="#catalogo">Catalogo</a>
            <a className="transition hover:text-white" href="#tecnologia">Tecnologia</a>
            <a className="transition hover:text-white" href="/login">Entrar</a>
          </nav>
          <Button className="hidden md:inline-flex" href="/register" variant="secondary">
            Comecar
          </Button>
        </div>
      </header>

      <section className="relative min-h-[82svh] overflow-hidden md:min-h-[88vh]">
        <img alt="" className="absolute inset-0 h-full w-full object-cover" src={featured.backdropUrl} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030609_0%,rgba(3,6,9,.84)_38%,rgba(3,6,9,.36)_72%,rgba(3,6,9,.76)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.25)_0%,rgba(3,6,9,.08)_44%,#030609_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/16" />

        <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-center px-5 pb-16 pt-28 md:min-h-[88vh] md:px-10 md:pb-20">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-semibold leading-[0.92] text-white md:text-8xl lg:text-9xl">
              MaxCinema
              <span className="mt-2 block text-cinema-cyan md:mt-4">Cinema OS 2026.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-cinema-muted md:text-xl">
              Uma nova experiencia premium de streaming, com qualidade cinematografica,
              curadoria editorial e uma base tecnica pronta para crescer.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/register" icon={<Play size={18} fill="currentColor" />}>
                Explorar plataforma
              </Button>
              <Button href="/login" variant="secondary">
                Entrar
              </Button>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-4 text-xs font-medium uppercase text-white/46 md:mt-14">
            <span className="h-px w-16 bg-cinema-cyan/70" />
            Role para explorar
            <span className="grid size-6 place-items-center rounded-full border border-cinema-cyan/40 text-cinema-cyan">
              <ChevronRight className="rotate-90" size={14} />
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 border-t border-white/8 bg-black/18 px-5 py-20 md:px-10" id="experiencia">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.55fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-cinema-cyan">Cinema OS 2026</p>
            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-tight text-white md:text-6xl">
              O cinema. Reinventado. Para voce.
            </h2>
            <div className="mt-10 space-y-7">
              {experience.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex gap-4" key={item.title}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-md border border-cinema-cyan/25 bg-cinema-cyan/8 text-cinema-cyan">
                      <Icon size={19} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-cinema-muted">{item.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <PlatformPreview />
        </div>
      </section>

      <section className="px-5 py-20 md:px-10" id="catalogo">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-5xl">Catalogo selecionado</h2>
              <p className="mt-3 text-sm text-cinema-muted md:text-base">Historias com identidade visual, metadados e rails preparados para streaming real.</p>
            </div>
            <Button className="hidden md:inline-flex" href="/browse" icon={<ArrowRight size={17} />} variant="ghost">
              Ver tudo
            </Button>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {catalog.map((movie) => (
              <PosterCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/8 px-5 py-20 md:px-10" id="tecnologia">
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_center,rgba(19,200,255,.24),transparent_62%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.5fr] lg:items-start">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-cinema-cyan">Tecnologia que sustenta</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Performance. Escala. Confianca.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-cinema-muted">
              Cinema OS 2026 foi desenhado sobre uma infraestrutura moderna, com autenticao,
              catalogo, midia, progresso e monetizacao futura no mesmo produto.
            </p>
            <Link className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cinema-cyan" href="/admin">
              Conhecer o Admin Studio
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stack.map((item) => {
              const Icon = item.icon;
              return (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.36)]" key={item.title}>
                  <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${item.glow} to-transparent`} />
                  <div className="relative">
                    <Icon className="text-cinema-cyan" size={30} />
                    <h3 className="mt-8 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 min-h-24 text-sm leading-6 text-cinema-muted">{item.description}</p>
                    <p className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                      <span className="size-2 rounded-full bg-emerald-300" />
                      {item.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 text-center md:px-10">
        <div className="mx-auto max-w-4xl">
          <Gauge className="mx-auto text-cinema-cyan" size={34} />
          <h2 className="mt-6 text-3xl font-semibold text-white md:text-5xl">
            Pronto para uma nova era do entretenimento?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-cinema-muted">
            Crie sua conta, entre na plataforma e veja o MaxCinema operando como produto real.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/register" icon={<Play size={18} fill="currentColor" />}>
              Explorar plataforma
            </Button>
            <Button href="/login" variant="secondary">
              Entrar
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <BrandMark />
          <p>© 2026 MaxCinema. Cinema OS 2026.</p>
          <div className="flex gap-5">
            <Link href="/login">Entrar</Link>
            <Link href="/register">Criar conta</Link>
            <Link href="/browse">Plataforma</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
