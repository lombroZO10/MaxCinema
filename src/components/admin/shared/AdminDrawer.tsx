import { X } from "lucide-react";

export function AdminDrawer() {
  return (
    <aside className="pointer-events-none fixed inset-y-0 right-0 z-50 hidden w-full max-w-md border-l border-white/10 bg-[#050b11]/92 p-6 opacity-0 shadow-[0_0_80px_rgba(0,0,0,.55)] backdrop-blur-2xl" aria-hidden="true">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Edicao rapida</h2>
        <button className="grid size-9 place-items-center rounded-md border border-white/10 text-white/70" type="button">
          <X size={16} />
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-cinema-muted">
        Drawer preparado para edicao inline de status, destaque, ordem e metadados sem sair da listagem.
      </p>
    </aside>
  );
}
