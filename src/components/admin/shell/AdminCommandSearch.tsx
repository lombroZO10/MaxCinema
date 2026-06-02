"use client";

import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

const commands = [
  { label: "Criar filme", href: "/admin/content/new", type: "Conteudo" },
  { label: "Gerenciar series", href: "/admin/content/series", type: "Conteudo" },
  { label: "Biblioteca de midia", href: "/admin/media", type: "Midia" },
  { label: "Editor da home", href: "/admin/home-editor", type: "Layout" },
  { label: "Usuarios", href: "/admin/users", type: "Acesso" },
  { label: "Configuracoes de SEO", href: "/admin/settings", type: "Sistema" },
];

export function AdminCommandSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 3);
    return commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <div className="group relative w-full max-w-xl">
      <label className="flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-black/34 px-4 text-sm text-white/56 shadow-[0_12px_44px_rgba(0,0,0,.25)] backdrop-blur-xl transition focus-within:border-cinema-cyan/50">
        <Search size={18} />
        <input
          className="h-full flex-1 bg-transparent text-white outline-none placeholder:text-white/38"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar conteudos, usuarios, categorias"
          value={query}
        />
        <Sparkles className="text-cinema-cyan" size={16} />
      </label>
      <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 hidden rounded-xl border border-white/10 bg-[#07111a]/96 p-2 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl group-focus-within:block">
        {results.map((result) => (
          <Link className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-white/76 transition hover:bg-white/8 hover:text-white" href={result.href} key={result.href}>
            <span>{result.label}</span>
            <span className="text-xs text-cinema-cyan">{result.type}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
