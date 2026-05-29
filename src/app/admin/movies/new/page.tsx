import { AdminMovieForm } from "@/components/admin/AdminMovieForm";
import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { createMovieAction } from "@/app/admin/actions";

export default async function NewMoviePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <h1 className="text-4xl font-semibold text-white">Cadastrar conteudo</h1>
        <p className="mt-2 text-cinema-muted">Estrutura pronta para poster, backdrop, trailer e Mux Playback ID.</p>
        <GlassPanel className="mt-8 p-6 md:p-8">
          <AdminMovieForm action={createMovieAction} error={error} />
        </GlassPanel>
      </main>
    </AppShell>
  );
}
