import { notFound } from "next/navigation";
import { updateMovieAction } from "@/app/admin/actions";
import { AdminMovieForm } from "@/components/admin/AdminMovieForm";
import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getMovieById } from "@/services/catalog-service";

export default async function EditMoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const movie = await getMovieById(id);
  if (!movie) notFound();

  const updateAction = updateMovieAction.bind(null, id);

  return (
    <AppShell>
      <main className="min-h-screen px-5 pb-20 pt-28 md:px-10 lg:px-16">
        <h1 className="text-4xl font-semibold text-white">Editar {movie.title}</h1>
        <p className="mt-2 text-cinema-muted">Formulario inicial conectado ao modelo de conteudo.</p>
        <GlassPanel className="mt-8 p-6 md:p-8">
          <AdminMovieForm action={updateAction} error={error} movie={movie} />
        </GlassPanel>
      </main>
    </AppShell>
  );
}
