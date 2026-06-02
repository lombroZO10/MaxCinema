import Link from "next/link";
import { ProfileForm } from "@/components/profiles/ProfileForm";

export default function NewViewerProfilePage() {
  return (
    <main className="min-h-screen bg-[#030609] px-5 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(19,200,255,.12),transparent_36%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <Link className="text-2xl font-semibold tracking-[-0.03em]" href="/profiles">
            MaxCinema
          </Link>
          <Link className="rounded-md border border-white/12 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href="/profiles">
            Voltar
          </Link>
        </header>
        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cinema-cyan">Profile Universe</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] md:text-6xl">Criar novo perfil</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/52">
            Configure um universo separado de exibicao, com tema, avatar, classificacao e preferencias proprias.
          </p>
        </section>
        <ProfileForm />
      </div>
    </main>
  );
}
