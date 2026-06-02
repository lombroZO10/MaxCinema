"use client";

import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Copy,
  Grid3X3,
  LayoutList,
  List,
  PanelRightOpen,
  Search,
  Shield,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  blockUserAction,
  unblockUserAction,
  updateUserRoleAction,
  updateUserStatusAction,
} from "@/app/admin/actions";
import type { AdminUserIndex, AdminUserIndexItem } from "@/services/admin/admin-user-service";
import { cn } from "@/utils/cn";

type ViewMode = "table" | "cards" | "compact";

type Filters = {
  query: string;
  role: "all" | AdminUserIndexItem["role"];
  status: "all" | AdminUserIndexItem["status"];
  plan: "all" | AdminUserIndexItem["plan"];
  activity: "all" | "recent_7" | "recent_30" | "none";
  consumption: "all" | "most_watch" | "most_fav" | "no_activity";
  sort: "created_desc" | "last_seen_desc" | "watch_desc" | "fav_desc";
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value?: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatRelativeDays(value?: string) {
  if (!value) return "sem acesso";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}s`;
  return `${Math.round(days / 30)}m`;
}

function badgeTone(kind: "role" | "status" | "plan", value: string) {
  if (kind === "role") {
    if (value === "owner" || value === "admin") return "border-cinema-cyan/30 bg-cinema-cyan/10 text-white/85";
    if (value === "editor") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
    if (value === "moderator") return "border-white/10 bg-white/[0.04] text-white/70";
    return "border-white/10 bg-white/[0.03] text-white/55";
  }
  if (kind === "status") {
    if (value === "active") return "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-100";
    if (value === "blocked") return "border-rose-300/18 bg-rose-300/[0.055] text-rose-100";
    if (value === "pending") return "border-amber-300/18 bg-amber-300/[0.055] text-amber-100";
    return "border-white/10 bg-white/[0.03] text-white/55";
  }
  if (value === "premium" || value === "trial") return "border-cinema-cyan/30 bg-cinema-cyan/10 text-white/85";
  if (value === "canceled") return "border-white/10 bg-white/[0.03] text-white/55";
  if (value === "free") return "border-white/10 bg-white/[0.04] text-white/70";
  return "border-white/10 bg-white/[0.03] text-white/55";
}

function lastSeenBucket(lastSeenAt?: string): Filters["activity"] {
  if (!lastSeenAt) return "none";
  const days = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return "recent_7";
  if (days <= 30) return "recent_30";
  return "none";
}

export function MemberStudio({ index, initialActiveId }: { index: AdminUserIndex; initialActiveId?: string | null }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => readLocal<ViewMode>("maxcinema.users.view", "table"));
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId ?? index.items[0]?.userId ?? null);
  const [filters, setFilters] = useState<Filters>(() =>
    readLocal<Filters>("maxcinema.users.filters", {
      query: "",
      role: "all",
      status: "all",
      plan: "all",
      activity: "all",
      consumption: "all",
      sort: "created_desc",
    }),
  );

  useEffect(() => writeLocal("maxcinema.users.view", viewMode), [viewMode]);
  useEffect(() => writeLocal("maxcinema.users.filters", filters), [filters]);

  const indexed = useMemo(() => new Map(index.items.map((u) => [u.userId, u])), [index.items]);

  const filtered = useMemo(() => {
    const q = normalize(filters.query.trim());

    const matchesQuery = (u: AdminUserIndexItem) => {
      if (!q) return true;
      const hay = normalize(`${u.fullName} ${u.emailHint} ${u.userId} ${u.role} ${u.status} ${u.plan}`);
      return hay.includes(q);
    };

    const inActivity = (u: AdminUserIndexItem) => {
      if (filters.activity === "all") return true;
      return lastSeenBucket(u.lastSeenAt) === filters.activity;
    };

    const inConsumption = (u: AdminUserIndexItem) => {
      if (filters.consumption === "all") return true;
      if (filters.consumption === "no_activity") return (u.watchedMinutes ?? 0) === 0 && (u.favoritesCount ?? 0) === 0;
      if (filters.consumption === "most_watch") return (u.watchedMinutes ?? 0) > 0;
      return (u.favoritesCount ?? 0) > 0;
    };

    const result = index.items
      .filter((u) => (filters.role === "all" ? true : u.role === filters.role))
      .filter((u) => (filters.status === "all" ? true : u.status === filters.status))
      .filter((u) => (filters.plan === "all" ? true : u.plan === filters.plan))
      .filter(inActivity)
      .filter(inConsumption)
      .filter(matchesQuery);

    const sorters: Record<Filters["sort"], (a: AdminUserIndexItem, b: AdminUserIndexItem) => number> = {
      created_desc: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      last_seen_desc: (a, b) => new Date(b.lastSeenAt ?? 0).getTime() - new Date(a.lastSeenAt ?? 0).getTime(),
      watch_desc: (a, b) => b.watchedMinutes - a.watchedMinutes,
      fav_desc: (a, b) => b.favoritesCount - a.favoritesCount,
    };

    return [...result].sort(sorters[filters.sort]);
  }, [filters, index.items]);

  const effectiveActiveId = activeId && indexed.has(activeId) ? activeId : filtered[0]?.userId ?? null;
  const active = effectiveActiveId ? indexed.get(effectiveActiveId) ?? null : null;

  const redirectTo = "/admin/users";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-4">
        <header className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Member Studio</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Usuarios</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Gestao de membros: perfis, consumo, favoritos e controles administrativos.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70">
              <Shield size={15} />
              dados reais
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            {[
              ["Usuarios", index.totals.users],
              ["Ativos", index.totals.active],
              ["Novos (mes)", index.totals.newThisMonth],
              ["Admins", index.totals.admins],
              ["Premium", index.totals.premium],
              ["Perfis", index.totals.profiles],
              ["Horas", index.totals.watchedHours],
              ["Favoritos", index.totals.favorites],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black/18 p-4" key={String(label)}>
                <p className="text-[11px] font-semibold uppercase text-white/38">{String(label)}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{String(value)}</p>
                <p className="mt-1 text-[11px] text-white/42">Atualizado {formatDate(index.updatedAt)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white/55 transition focus-within:border-cinema-cyan/50">
              <Search size={17} />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
                onChange={(event) => setFilters((c) => ({ ...c, query: event.target.value }))}
                placeholder="Buscar por nome, id, role, plano, status"
                value={filters.query}
              />
              <span className="text-xs text-white/35">{filtered.length}/{index.items.length}</span>
            </label>

            <button
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
                showFilters ? "border-cinema-cyan/40 bg-cinema-cyan/10 text-white" : "border-white/10 bg-white/[0.035] text-white/66 hover:text-white",
              )}
              onClick={() => setShowFilters((c) => !c)}
              type="button"
            >
              <PanelRightOpen size={16} />
              Filtros
              <ChevronDown className={cn("transition", showFilters && "rotate-180")} size={16} />
            </button>

            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
              {([
                ["table", LayoutList, "Tabela"],
                ["cards", Grid3X3, "Cards"],
                ["compact", List, "Compacto"],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 text-xs font-semibold transition",
                    viewMode === mode ? "bg-cinema-cyan text-slate-950" : "text-white/64 hover:bg-white/8 hover:text-white",
                  )}
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  type="button"
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {showFilters ? (
            <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Role</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, role: e.target.value as Filters["role"] }))}
                    value={filters.role}
                  >
                    <option value="all">Todos</option>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                    <option value="moderator">moderator</option>
                    <option value="user">user</option>
                  </select>
                </label>
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Status</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value as Filters["status"] }))}
                    value={filters.status}
                  >
                    <option value="all">Todos</option>
                    <option value="active">ativo</option>
                    <option value="inactive">inativo</option>
                    <option value="pending">pendente</option>
                    <option value="blocked">bloqueado</option>
                  </select>
                </label>
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Plano</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, plan: e.target.value as Filters["plan"] }))}
                    value={filters.plan}
                  >
                    <option value="all">Todos</option>
                    <option value="premium">premium</option>
                    <option value="trial">trial</option>
                    <option value="free">free</option>
                    <option value="canceled">canceled</option>
                    <option value="unknown">unknown</option>
                  </select>
                </label>
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Atividade</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, activity: e.target.value as Filters["activity"] }))}
                    value={filters.activity}
                  >
                    <option value="all">Todas</option>
                    <option value="recent_7">ultimos 7 dias</option>
                    <option value="recent_30">ultimos 30 dias</option>
                    <option value="none">sem acesso</option>
                  </select>
                </label>
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Consumo</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, consumption: e.target.value as Filters["consumption"] }))}
                    value={filters.consumption}
                  >
                    <option value="all">Todos</option>
                    <option value="most_watch">mais assistem</option>
                    <option value="most_fav">mais favoritam</option>
                    <option value="no_activity">sem atividade</option>
                  </select>
                </label>
                <label className="text-sm text-white/62">
                  <span className="text-xs font-semibold uppercase text-white/40">Ordenar</span>
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none"
                    onChange={(e) => setFilters((c) => ({ ...c, sort: e.target.value as Filters["sort"] }))}
                    value={filters.sort}
                  >
                    <option value="created_desc">mais novos</option>
                    <option value="last_seen_desc">ultimo acesso</option>
                    <option value="watch_desc">tempo assistido</option>
                    <option value="fav_desc">favoritos</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}
        </header>

        {viewMode === "compact" ? (
          <div className="divide-y divide-white/8 rounded-xl border border-white/10 bg-white/[0.04]">
            {filtered.map((u) => (
              <button
                className={cn("flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.045]", effectiveActiveId === u.userId && "bg-white/[0.035]")}
                key={u.userId}
                onClick={() => setActiveId(u.userId)}
                type="button"
              >
                <div className="grid size-10 place-items-center rounded-md border border-white/10 bg-black/18 text-white/70">
                  <User2 size={16} />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{u.fullName}</span>
                  <span className="mt-1 block truncate text-xs text-white/42">
                    {u.emailHint} · {u.plan} · {formatRelativeDays(u.lastSeenAt)} · {u.favoritesCount} fav · {u.watchedMinutes} min
                  </span>
                </span>
                <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("status", u.status))}>{u.status}</span>
              </button>
            ))}
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((u) => (
              <article className={cn("overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:border-white/18 hover:bg-white/[0.055]", effectiveActiveId === u.userId && "border-cinema-cyan/35")} key={u.userId}>
                <button className="block w-full text-left" onClick={() => setActiveId(u.userId)} type="button">
                  <div className="border-b border-white/8 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center rounded-lg border border-white/10 bg-black/18 text-white/70">
                          <User2 size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-white/38">Usuario</p>
                          <p className="mt-1 text-lg font-semibold text-white">{u.fullName}</p>
                          <p className="mt-1 text-xs text-white/45">{u.emailHint}</p>
                        </div>
                      </div>
                      <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("plan", u.plan))}>{u.plan}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className={cn("rounded-full border px-2 py-1 font-semibold", badgeTone("role", u.role))}>{u.role}</span>
                      <span className={cn("rounded-full border px-2 py-1 font-semibold", badgeTone("status", u.status))}>{u.status}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-semibold text-white/62">{u.profileCount} perfis</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-4 text-sm">
                    <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-xs text-white/45">Favoritos</p>
                      <p className="mt-1 font-semibold text-white">{u.favoritesCount}</p>
                    </div>
                    <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-xs text-white/45">Minutos</p>
                      <p className="mt-1 font-semibold text-white">{u.watchedMinutes}</p>
                    </div>
                    <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-xs text-white/45">Acesso</p>
                      <p className="mt-1 font-semibold text-white">{formatRelativeDays(u.lastSeenAt)}</p>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-black/25 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Plano</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Ultimo acesso</th>
                  <th className="px-5 py-4">Perfis</th>
                  <th className="px-5 py-4">Fav</th>
                  <th className="px-5 py-4">Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((u) => (
                  <tr className={cn("cursor-pointer hover:bg-white/[0.045]", effectiveActiveId === u.userId && "bg-white/[0.035]")} key={u.userId} onClick={() => setActiveId(u.userId)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-md border border-white/10 bg-black/18 text-white/70">
                          <User2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{u.fullName}</p>
                          <p className="truncate text-xs text-white/42">{u.emailHint}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("role", u.role))}>{u.role}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("plan", u.plan))}>{u.plan}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("status", u.status))}>{u.status}</span>
                    </td>
                    <td className="px-5 py-4 text-white/55">{formatRelativeDays(u.lastSeenAt)}</td>
                    <td className="px-5 py-4 text-white/55">{u.profileCount}</td>
                    <td className="px-5 py-4 text-white/55">{u.favoritesCount}</td>
                    <td className="px-5 py-4 text-white/55">{u.watchedMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Detalhes</h2>
          <span className="text-xs text-cinema-cyan">drawer lateral</span>
        </div>

        {active ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/18 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-lg border border-white/10 bg-black/18 text-white/70">
                    <User2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-white/38">Membro</p>
                    <p className="mt-1 text-lg font-semibold text-white">{active.fullName}</p>
                    <p className="mt-1 text-xs text-white/45">{active.emailHint}</p>
                    <p className="mt-2 text-xs text-white/40">id: {active.userId}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("plan", active.plan))}>{active.plan}</span>
                  <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", badgeTone("status", active.status))}>{active.status}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                  <p className="text-xs text-white/45">Criado</p>
                  <p className="mt-1 font-semibold text-white">{formatDate(active.createdAt)}</p>
                </div>
                <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                  <p className="text-xs text-white/45">Ultimo acesso</p>
                  <p className="mt-1 font-semibold text-white">{active.lastSeenAt ? formatDate(active.lastSeenAt) : "--"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/18 p-4">
              <p className="text-xs font-semibold uppercase text-white/42">Consumo</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                  <p className="text-xs text-white/45">Perfis</p>
                  <p className="mt-1 font-semibold text-white">{active.profileCount}</p>
                </div>
                <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                  <p className="text-xs text-white/45">Fav</p>
                  <p className="mt-1 font-semibold text-white">{active.favoritesCount}</p>
                </div>
                <div className="rounded-md border border-white/8 bg-black/18 px-3 py-3">
                  <p className="text-xs text-white/45">Min</p>
                  <p className="mt-1 font-semibold text-white">{active.watchedMinutes}</p>
                </div>
              </div>
              {active.recentFavorites.length ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-white/42">Favoritos recentes</p>
                  <div className="mt-2 flex gap-2 overflow-hidden">
                    {active.recentFavorites.slice(0, 6).map((movie, idx) => (
                      <img
                        alt=""
                        className="aspect-[2/3] w-14 shrink-0 rounded-md border border-white/10 object-cover"
                        key={`${movie.id}-${idx}`}
                        src={movie.posterUrl}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/18 p-4">
              <p className="text-xs font-semibold uppercase text-white/42">Acoes administrativas</p>
              <div className="mt-3 space-y-3">
                <form action={updateUserRoleAction.bind(null, active.userId)} className="grid gap-2">
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-xs font-semibold text-white/55">
                    Role
                    <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={active.role} name="role">
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                    </select>
                  </label>
                  <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cinema-cyan text-xs font-semibold text-slate-950" type="submit">
                    <CheckCircle2 size={14} />
                    Atualizar role
                  </button>
                </form>

                <form action={updateUserStatusAction.bind(null, active.userId)} className="grid gap-2">
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-xs font-semibold text-white/55">
                    Status
                    <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" defaultValue={active.status === "blocked" ? "active" : active.status} name="status">
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="pending">pending</option>
                    </select>
                  </label>
                  <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/70 hover:text-white" type="submit">
                    Atualizar status
                  </button>
                </form>

                {active.status !== "blocked" ? (
                  <form action={blockUserAction.bind(null, active.userId)} className="grid gap-2">
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-300/18 bg-rose-300/[0.055] text-xs font-semibold text-rose-100" type="submit">
                      <Ban size={14} />
                      Bloquear
                    </button>
                  </form>
                ) : (
                  <form action={unblockUserAction.bind(null, active.userId)} className="grid gap-2">
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-300/18 bg-emerald-300/[0.035] text-xs font-semibold text-emerald-100" type="submit">
                      <CheckCircle2 size={14} />
                      Desbloquear
                    </button>
                  </form>
                )}

                <button
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/22 text-xs font-semibold text-white/55"
                  onClick={() => {
                    navigator.clipboard?.writeText(active.userId);
                  }}
                  type="button"
                >
                  <Copy size={14} />
                  Copiar id
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-white/45">Selecione um usuario para ver detalhes e acoes.</p>
        )}
      </aside>
    </div>
  );
}
