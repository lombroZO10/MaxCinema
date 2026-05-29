import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="cinema-bg grid min-h-screen place-items-center px-5">
      <EmptyState
        description="O conteudo solicitado nao existe ou ainda nao foi publicado."
        title="Conteudo nao encontrado"
      />
    </main>
  );
}
