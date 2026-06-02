import Link from "next/link";
import { ManageProfilesGrid } from "@/components/profiles/ManageProfilesGrid";
import { getViewerProfiles } from "@/services/profile/viewer-profile-service";

export default async function ManageProfilesPage() {
  const profiles = await getViewerProfiles();

  return (
    <main className="min-h-screen bg-[#030609] px-5 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(19,200,255,.12),transparent_36%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <Link className="text-2xl font-semibold tracking-[-0.03em]" href="/profiles">
            MaxCinema
          </Link>
          <Link className="rounded-md bg-cinema-cyan px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#65ddff]" href="/profiles/new">
            Novo perfil
          </Link>
        </header>
        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cinema-cyan">Profile Universe</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] md:text-6xl">Gerenciar perfis</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/52">
            Edite avatares, temas, restricoes e preferencias. Cada perfil mantem sua propria experiencia.
          </p>
        </section>
        <ManageProfilesGrid profiles={profiles} />
      </div>
    </main>
  );
}
