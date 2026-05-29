"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="cinema-bg grid min-h-screen place-items-center px-5">
      <section className="glass max-w-lg rounded-xl p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Algo saiu do ar</h1>
        <p className="mt-3 text-sm leading-6 text-cinema-muted">
          Nao foi possivel carregar esta area do MaxCinema.
        </p>
        <Button className="mt-7" onClick={reset}>
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
