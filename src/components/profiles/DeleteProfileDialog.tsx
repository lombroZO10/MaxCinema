"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { deleteViewerProfileAction } from "@/app/profiles/actions";
import type { ViewerProfile } from "@/types/domain";

export function DeleteProfileDialog({ profile }: { profile: ViewerProfile }) {
  const [open, setOpen] = useState(false);

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[80] grid place-items-center px-4">
            <button
              aria-label="Fechar modal pela area externa"
              className="absolute inset-0 bg-black/76 backdrop-blur-md"
              onClick={() => setOpen(false)}
              type="button"
            />
            <section
              aria-labelledby="delete-profile-title"
              aria-modal="true"
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#080c11]/96 p-5 text-white shadow-[0_34px_120px_rgba(0,0,0,.62)]"
              role="dialog"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,72,72,.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(19,200,255,.09),transparent_34%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-full border border-red-300/18 bg-red-500/12 text-red-100">
                      <AlertTriangle size={19} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-0.02em]" id="delete-profile-title">
                        Excluir perfil
                      </h2>
                      <p className="mt-1 text-sm text-white/46">Essa acao nao pode ser desfeita.</p>
                    </div>
                  </div>
                  <button
                    aria-label="Fechar modal"
                    className="grid size-9 place-items-center rounded-md text-white/46 transition hover:bg-white/8 hover:text-white"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-3">
                  <img alt="" className="size-16 rounded-xl object-cover ring-1 ring-white/12" src={profile.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{profile.name}</p>
                    <p className="mt-1 text-sm text-white/46">
                      Favoritos, progresso e recomendacoes deste perfil serao removidos.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    className="rounded-md border border-white/12 bg-white/[0.055] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <form action={deleteViewerProfileAction}>
                    <input name="profileId" type="hidden" value={profile.id} />
                    <button className="w-full rounded-md bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-950 transition hover:bg-white sm:w-auto" type="submit">
                      Excluir definitivamente
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-label={`Excluir perfil ${profile.name}`}
        className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/[0.045] text-white/42 transition hover:bg-red-500/14 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/35"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Trash2 size={15} />
      </button>
      {modal}
    </>
  );
}
