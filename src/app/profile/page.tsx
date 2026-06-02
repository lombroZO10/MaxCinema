import {
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  Crown,
  Heart,
  LogOut,
  MonitorPlay,
  Pencil,
  Play,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { clearActiveProfileAction } from "@/app/profiles/actions";
import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCurrentProfile } from "@/services/profile-service";
import { getActiveViewerProfile, getViewerProfiles } from "@/services/profile/viewer-profile-service";
import { getMaxCinemaIntelligence } from "@/services/recommendation/recommendation-engine";
import { getFavoriteMovies, getWatchProgressItems } from "@/services/user-library-service";
import type { Movie, UserRole, ViewerProfile } from "@/types/domain";
import { cn } from "@/utils/cn";

function formatDate(value?: string) {
  if (!value) return "Ainda nao registrado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatHoursFromProgress(progressItems: Awaited<ReturnType<typeof getWatchProgressItems>>) {
  const minutes = progressItems.reduce((total, entry) => total + Math.floor(entry.item.progressSeconds / 60), 0);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    owner: "Proprietario",
    admin: "Administrador",
    editor: "Editor",
    moderator: "Moderador",
    user: "Usuario",
  };
  return labels[role] ?? "Usuario";
}

function ProfileAvatar({ profile }: { profile: ViewerProfile | null }) {
  if (!profile) {
    return (
      <div className="grid size-28 place-items-center rounded-[1.35rem] border border-white/12 bg-white/[0.055] text-white/50 md:size-36">
        <UserRound size={42} />
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        alt=""
        className="size-28 rounded-[1.35rem] object-cover shadow-[0_30px_80px_rgba(0,0,0,.42)] ring-1 ring-white/14 md:size-36"
        src={profile.avatarUrl}
      />
      <span
        className="absolute -bottom-2 -right-2 size-7 rounded-full border-4 border-[#070b10]"
        style={{ backgroundColor: profile.themeColor }}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Heart;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,.24)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-white/[0.055] text-cinema-cyan ring-1 ring-white/10">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-2 text-sm text-white/46">{detail}</p>
    </div>
  );
}

function MiniMovie({ movie }: { movie: Movie }) {
  return (
    <Link className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 transition hover:bg-white/[0.055]" href={`/movie/${movie.slug}`}>
      <img alt="" className="h-20 w-14 rounded-lg object-cover ring-1 ring-white/10" src={movie.posterUrl} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white group-hover:text-cinema-cyan">{movie.title}</span>
        <span className="mt-1 block text-xs text-white/42">
          {movie.releaseYear} - {movie.durationMinutes} min
        </span>
      </span>
    </Link>
  );
}

export default async function ProfilePage() {
  const [profile, activeProfile, profiles, favoriteMovies, progressItems, intelligence] = await Promise.all([
    getCurrentProfile(),
    getActiveViewerProfile(),
    getViewerProfiles(),
    getFavoriteMovies(),
    getWatchProgressItems(),
    getMaxCinemaIntelligence(),
  ]);

  const cinematic = intelligence.profile;
  const isAdmin = ["owner", "admin", "editor", "moderator"].includes(profile.role);
  const continueItems = progressItems.slice(0, 3);
  const favoritePreview = favoriteMovies.slice(0, 3);
  const completionAverage = progressItems.length
    ? Math.round(
        progressItems.reduce((total, entry) => total + entry.item.progressSeconds / Math.max(entry.item.durationSeconds, 1), 0) /
          progressItems.length *
          100,
      )
    : 0;

  return (
    <AppShell>
      <main className="min-h-screen px-4 pb-20 pt-24 text-white md:px-8 md:pt-28 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-[1500px]">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071016] p-4 shadow-[0_32px_130px_rgba(0,0,0,.42)] md:p-8 xl:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(19,200,255,.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(244,184,96,.12),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/38 to-transparent" />
            <div className="relative grid gap-5 md:gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-7">
                <ProfileAvatar profile={activeProfile} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3 py-1 text-xs font-semibold text-white/70">
                      <Crown size={13} />
                      {profile.plan}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cinema-cyan/20 bg-cinema-cyan/10 px-3 py-1 text-xs font-semibold text-cinema-cyan">
                      <BadgeCheck size={13} />
                      {roleLabel(profile.role)}
                    </span>
                  </div>
                  <h1 className="mt-4 text-[2.75rem] font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-5xl md:mt-5 md:text-7xl">
                    {activeProfile?.name ?? profile.fullName}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/58 md:text-lg">
                    Central da sua experiencia MaxCinema: perfis, plano, lista, progresso e preferencias de reproducao em um unico lugar.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-7">
                    <Link className="inline-flex items-center justify-center gap-2 rounded-md bg-cinema-cyan px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#65ddff]" href="/profiles/manage">
                      <Pencil size={17} />
                      Gerenciar perfis
                    </Link>
                    <form action={clearActiveProfileAction}>
                      <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white sm:w-auto" type="submit">
                        <UsersRound size={17} />
                        Trocar perfil
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <GlassPanel className="p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">Conta principal</p>
                <div className="mt-4 flex items-center gap-4 md:mt-5">
                  <img alt="" className="size-12 rounded-full object-cover ring-1 ring-white/14 md:size-14" src={profile.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{profile.fullName}</p>
                    <p className="mt-1 text-sm text-white/44">Status: {profile.status ?? "active"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:mt-5 md:grid-cols-1">
                  <div className="hidden justify-between gap-3 border-t border-white/8 pt-4 md:flex">
                    <span className="text-white/42">Ultimo acesso</span>
                    <span className="text-right font-medium text-white/76">{formatDate(profile.lastSeenAt)}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-white/8 pt-3 md:pt-4">
                    <span className="text-white/42">Perfis</span>
                    <span className="font-medium text-white/76">{profiles.length}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-white/8 pt-3 md:pt-4">
                    <span className="text-white/42">Qualidade</span>
                    <span className="font-medium text-white/76">4K HDR</span>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard detail="Somente neste perfil" icon={Heart} label="Favoritos" value={String(cinematic.favoriteCount)} />
            <MetricCard detail="Historico assistido" icon={MonitorPlay} label="Tempo visto" value={formatHoursFromProgress(progressItems)} />
            <MetricCard detail={cinematic.archetype} icon={Sparkles} label="Curadoria" value={cinematic.favoriteGenre} />
            <MetricCard detail="Media dos itens iniciados" icon={Play} label="Progresso medio" value={`${completionAverage}%`} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <GlassPanel className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Perfil ativo</h2>
                    <p className="mt-2 text-sm text-white/46">Preferencias aplicadas ao catalogo, favoritos e recomendacoes.</p>
                  </div>
                  {activeProfile?.profileType === "kids" ? (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">Kids</span>
                  ) : (
                    <span className="rounded-full border border-white/12 bg-white/[0.055] px-3 py-1 text-xs font-semibold text-white/64">Adulto</span>
                  )}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {[
                    ["Idioma", activeProfile?.language ?? "pt-BR"],
                    ["Classificacao maxima", activeProfile?.maturityLimit ?? "18"],
                    ["Autoplay", activeProfile?.autoplayEnabled ? "Ativado" : "Desativado"],
                    ["Trailer autoplay", activeProfile?.trailerAutoplayEnabled ? "Ativado" : "Desativado"],
                  ].map(([label, value]) => (
                    <div className="rounded-xl border border-white/10 bg-black/18 p-4" key={label}>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">{label}</p>
                      <p className="mt-2 text-base font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Universos da conta</h2>
                    <p className="mt-2 text-sm text-white/46">Cada perfil tem lista, progresso e recomendacoes separados.</p>
                  </div>
                  <Link className="text-sm font-semibold text-cinema-cyan hover:text-white" href="/profiles/manage">
                    Editar
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((item) => (
                    <Link
                      className={cn(
                        "rounded-xl border bg-white/[0.035] p-3 transition hover:bg-white/[0.06]",
                        activeProfile?.id === item.id ? "border-cinema-cyan/45" : "border-white/10",
                      )}
                      href={`/profiles/${item.id}/edit`}
                      key={item.id}
                    >
                      <div className="flex items-center gap-3">
                        <img alt="" className="size-12 rounded-xl object-cover ring-1 ring-white/10" src={item.avatarUrl} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                          <p className="mt-1 text-xs text-white/42">{item.profileType === "kids" ? "Perfil Kids" : "Perfil adulto"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Atividade recente</h2>
                    <p className="mt-2 text-sm text-white/46">Conteudos iniciados neste perfil.</p>
                  </div>
                  <Link className="text-sm font-semibold text-cinema-cyan hover:text-white" href="/continue-watching">
                    Ver tudo
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {continueItems.length ? (
                    continueItems.map(({ movie, item }) => (
                      <Link className="group rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/[0.055]" href={`/watch/${movie.id}`} key={movie.id}>
                        <div className="relative overflow-hidden rounded-lg">
                          <img alt="" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" src={movie.backdropUrl} />
                          <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/18">
                            <span
                              className="block h-full rounded-full bg-cinema-cyan"
                              style={{ width: `${Math.min(100, Math.round((item.progressSeconds / Math.max(item.durationSeconds, 1)) * 100))}%` }}
                            />
                          </div>
                        </div>
                        <p className="mt-3 truncate text-sm font-semibold text-white">{movie.title}</p>
                        <p className="mt-1 text-xs text-white/42">{item.label}</p>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.025] p-5 text-sm text-white/46 md:col-span-3">
                      Nada iniciado ainda. Quando voce assistir algo, essa area vira seu ponto de retorno.
                    </div>
                  )}
                </div>
              </GlassPanel>
            </div>

            <aside className="space-y-6">
              <GlassPanel className="p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-cinema-cyan text-slate-950">
                    <Crown size={20} />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">MaxCinema Premium</h2>
                    <p className="mt-1 text-sm text-white/46">Plano ativo</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-white/58">
                  <p className="flex items-center gap-2"><Clapperboard size={16} /> Catalogo completo</p>
                  <p className="flex items-center gap-2"><MonitorPlay size={16} /> 4K HDR preparado</p>
                  <p className="flex items-center gap-2"><UsersRound size={16} /> Perfis independentes</p>
                </div>
                {isAdmin ? (
                  <Link className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href="/admin/subscriptions">
                    Ver assinatura
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <p className="mt-6 rounded-md border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-sm font-semibold text-white/54">
                    Assinatura ativa
                  </p>
                )}
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">Favoritos recentes</h2>
                <div className="mt-5 grid gap-3">
                  {favoritePreview.length ? (
                    favoritePreview.map((movie) => <MiniMovie key={movie.id} movie={movie} />)
                  ) : (
                    <p className="rounded-xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm text-white/46">
                      Sua lista ainda esta vazia.
                    </p>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <form action={signOutAction}>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200/12 bg-red-500/8 px-4 py-3 text-sm font-semibold text-red-100/78 transition hover:bg-red-500/14 hover:text-red-50" type="submit">
                    <LogOut size={16} />
                    Sair da conta
                  </button>
                </form>
              </GlassPanel>
            </aside>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
