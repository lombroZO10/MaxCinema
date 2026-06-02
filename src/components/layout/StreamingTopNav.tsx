"use client";

import { Bell, Search, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearActiveProfileAction } from "@/app/profiles/actions";
import { cinematicNav, type SidebarItem } from "@/components/layout/sidebar-nav";
import type { Profile } from "@/types/domain";
import type { ViewerProfile } from "@/types/domain";
import { cn } from "@/utils/cn";

function isActive(pathname: string, currentHash: string, item: SidebarItem) {
  const [baseHref, hash] = item.href.split("#");
  if (hash) return pathname === baseHref && currentHash === `#${hash}`;
  if (item.exact) return pathname === baseHref;
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

export function StreamingTopNav({
  profile,
  viewerProfile,
  searchQuery = "",
  signOutAction,
  siteName = "MaxCinema",
  logoUrl = "",
  enabledNavHrefs,
}: {
  profile: Profile;
  viewerProfile?: ViewerProfile | null;
  searchQuery?: string;
  signOutAction: () => Promise<void>;
  siteName?: string;
  logoUrl?: string;
  enabledNavHrefs?: string[];
}) {
  const pathname = usePathname();
  const enabledHrefSet = new Set(enabledNavHrefs ?? cinematicNav.map((item) => item.href));
  const navItems = cinematicNav.filter((item) => enabledHrefSet.has(item.href));
  const [currentHash, setCurrentHash] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const displayName = viewerProfile?.name || profile.fullName;
  const displayAvatar = viewerProfile?.avatarUrl || profile.avatarUrl;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);
    const syncScroll = () => setScrolled(window.scrollY > 36);

    syncHash();
    syncScroll();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("scroll", syncScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("scroll", syncScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition duration-500",
        scrolled
          ? "border-b border-white/10 bg-[#030609]/82 shadow-[0_18px_70px_rgba(0,0,0,.36)] backdrop-blur-2xl"
          : "bg-gradient-to-b from-black/62 via-black/24 to-transparent backdrop-blur-[2px]",
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1920px] items-center gap-5 px-5 md:px-8 xl:h-[84px] xl:px-12 2xl:px-16">
        <Link className="flex shrink-0 items-center gap-3 text-2xl font-semibold tracking-[-0.03em] text-white xl:text-[1.7rem]" href="/browse">
          {logoUrl ? <img alt="" className="h-9 w-auto max-w-36 object-contain" src={logoUrl} /> : null}
          <span>{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.filter((item) => item.href !== "/admin").slice(0, 6).map((item) => {
            const active = isActive(pathname, currentHash, item);
            return (
              <Link
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium text-white/58 transition duration-300 hover:text-white",
                  active && "text-white",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
                {active ? <span className="absolute inset-x-3 -bottom-0.5 h-px rounded-full bg-white/78" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <form
            action="/browse"
            className={cn(
              "hidden h-11 items-center gap-3 rounded-md border px-4 text-sm transition duration-300 md:flex md:w-[220px] lg:w-[260px] xl:w-[340px]",
              scrolled ? "border-white/12 bg-white/[0.055]" : "border-white/10 bg-black/28",
            )}
          >
            <Search className="text-white/48" size={17} />
            <input
              aria-label="Buscar no MaxCinema"
              className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/42"
              defaultValue={searchQuery}
              name="q"
              placeholder="Buscar filmes e series"
            />
          </form>

          <button
            aria-label="Notificacoes"
            className="hidden size-11 place-items-center rounded-md border border-white/10 bg-black/26 text-white/62 backdrop-blur transition hover:bg-white/8 hover:text-white md:grid"
            type="button"
          >
            <Bell size={17} />
          </button>

          <div className="group relative">
            <Link
              aria-label="Perfil"
              className="grid size-11 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/[0.07] text-sm font-semibold text-white shadow-[0_12px_35px_rgba(0,0,0,.25)] transition hover:bg-white/[0.11]"
              href="/profile"
            >
              {displayAvatar ? <img alt="" className="h-full w-full object-cover" src={displayAvatar} /> : initials}
            </Link>

            <div className="invisible absolute right-0 top-full w-64 pt-3 opacity-0 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070b10]/95 p-2 shadow-[0_24px_90px_rgba(0,0,0,.5)] backdrop-blur-2xl">
                <div className="flex items-center gap-3 border-b border-white/8 p-3">
                  <div className="grid size-11 place-items-center overflow-hidden rounded-full bg-white/8 text-sm font-semibold text-white ring-1 ring-white/12">
                    {displayAvatar ? <img alt="" className="h-full w-full object-cover" src={displayAvatar} /> : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                    <p className="mt-0.5 text-xs text-cinema-cyan">{viewerProfile?.profileType === "kids" ? "Perfil Kids" : "MaxCinema Premium"}</p>
                  </div>
                </div>

                <form action={clearActiveProfileAction} className="mt-2">
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/7 hover:text-white" type="submit">
                    Trocar perfil
                  </button>
                </form>

                <Link className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/7 hover:text-white" href="/profile">
                  <User size={16} />
                  Perfil e conta
                </Link>
                <Link className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/7 hover:text-white" href="/admin">
                  <Shield size={16} />
                  Admin Studio
                </Link>
                <Link className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/7 hover:text-white" href="/admin/settings">
                  <Settings size={16} />
                  Configuracoes
                </Link>
                <form action={signOutAction} className="mt-2 border-t border-white/8 pt-2">
                  <button className="w-full rounded-md px-3 py-2.5 text-left text-sm text-white/48 transition hover:bg-white/7 hover:text-red-100" type="submit">
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
