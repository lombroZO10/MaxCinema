"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminSearchItem } from "@/services/admin-service";

export function AdminGlobalSearch({ items }: { items: AdminSearchItem[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return items.slice(0, 8);

    return items
      .filter((item) => {
        const haystack = `${item.label} ${item.description} ${item.type}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 10);
  }, [items, normalizedQuery]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Busca global</h2>
          <p className="mt-1 text-sm text-white/45">Filmes, series, categorias, usuarios, colecoes e secoes em um unico comando.</p>
        </div>
        <label className="flex h-11 w-full items-center gap-3 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/55 transition focus-within:border-cinema-cyan/50 lg:max-w-md">
          <Search size={17} />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no Studio"
            value={query}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {results.length ? (
          results.map((item) => (
            <Link
              className="group flex min-h-20 items-center justify-between gap-3 rounded-md border border-white/8 bg-black/18 px-3 py-3 transition hover:border-cinema-cyan/30 hover:bg-white/[0.055]"
              href={item.href}
              key={`${item.type}-${item.id}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{item.label}</span>
                <span className="mt-1 block truncate text-xs text-white/42">{item.type} / {item.description}</span>
              </span>
              <ArrowRight className="shrink-0 text-white/35 transition group-hover:text-cinema-cyan" size={16} />
            </Link>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm text-white/45 md:col-span-2 xl:col-span-4">
            Nenhum resultado encontrado para essa busca.
          </p>
        )}
      </div>
    </section>
  );
}
