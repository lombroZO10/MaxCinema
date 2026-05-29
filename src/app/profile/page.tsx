import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { profile, progress } from "@/services/content-service";

export default function ProfilePage() {
  return (
    <AppShell>
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-20 pt-28 md:px-10">
        <GlassPanel className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
          <div>
            <img alt="" className="size-36 rounded-xl object-cover ring-1 ring-white/15" src={profile.avatarUrl} />
            <h1 className="mt-5 text-3xl font-semibold text-white">{profile.fullName}</h1>
            <p className="mt-1 text-cinema-cyan">{profile.plan}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Perfil", profile.role],
              ["Conteudos em andamento", String(progress.length)],
              ["Qualidade", "4K HDR"],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5" key={label}>
                <p className="text-xs uppercase text-cinema-muted">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </main>
    </AppShell>
  );
}
