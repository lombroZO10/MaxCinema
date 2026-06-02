import Link from "next/link";
import type { ViewerProfile } from "@/types/domain";
import { selectViewerProfileAction } from "@/app/profiles/actions";
import { ProfileCard } from "@/components/profiles/ProfileCard";

export function ProfileSelectScreen({ profiles }: { profiles: ViewerProfile[] }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030609] px-5 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(19,200,255,.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,.035),transparent_45%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link className="text-2xl font-semibold tracking-[-0.03em]" href="/">
            MaxCinema
          </Link>
          <Link className="rounded-md border border-white/12 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href="/profiles/manage">
            Gerenciar perfis
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-14">
          <h1 className="text-center text-4xl font-semibold tracking-[-0.035em] md:text-6xl">Quem esta assistindo?</h1>
          <p className="mt-4 max-w-2xl text-center text-base leading-7 text-white/52">
            Escolha um universo de exibicao. Favoritos, progresso e recomendacoes ficam separados por perfil.
          </p>

          {profiles.length ? (
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {profiles.map((profile) => (
                <ProfileCard action={selectViewerProfileAction} key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-white/16 bg-white/[0.035] p-10 text-center">
              <p className="text-lg font-semibold">Nenhum perfil criado ainda.</p>
              <p className="mt-2 text-sm text-white/48">Crie o primeiro perfil para entrar no MaxCinema.</p>
            </div>
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link className="rounded-md bg-cinema-cyan px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#65ddff]" href="/profiles/new">
              Adicionar perfil
            </Link>
            <Link className="rounded-md border border-white/12 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href="/profiles/manage">
              Gerenciar perfis
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
