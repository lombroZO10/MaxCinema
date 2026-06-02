import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminConfirmModal() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 hidden place-items-center bg-black/70 p-5 backdrop-blur-sm" aria-hidden="true">
      <section className="glass w-full max-w-md rounded-xl p-6">
        <div className="grid size-12 place-items-center rounded-full bg-cinema-amber/12 text-cinema-amber">
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">Confirmar acao</h2>
        <p className="mt-2 text-sm leading-6 text-cinema-muted">
          Modal preparado para exclusoes, publicacoes e mudancas criticas do catalogo.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary">Cancelar</Button>
          <Button variant="danger">Confirmar</Button>
        </div>
      </section>
    </div>
  );
}
