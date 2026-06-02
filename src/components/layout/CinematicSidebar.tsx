"use client";

import { motion } from "framer-motion";
import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cinematicNav, type SidebarItem } from "@/components/layout/sidebar-nav";
import type { Profile } from "@/types/domain";
import { cn } from "@/utils/cn";

function isActive(pathname: string, currentHash: string, item: SidebarItem) {
  const [baseHref, hash] = item.href.split("#");
  if (hash) return pathname === baseHref && currentHash === `#${hash}`;
  if (item.exact) return pathname === baseHref;
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

export function CinematicSidebar({
  profile,
  signOutAction,
}: {
  profile: Profile;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");
  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="cinematic-sidebar-grain fixed inset-y-0 left-0 z-40 hidden w-72 overflow-hidden border-r border-white/[0.075] bg-[#05080b]/88 px-6 py-7 shadow-[24px_0_90px_rgba(0,0,0,.42),inset_-1px_0_0_rgba(255,255,255,.035)] backdrop-blur-2xl xl:block"
      initial={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.035),transparent_32%,rgba(19,200,255,.02)_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-white/[0.032] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cinema-cyan/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-[70%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,.16),transparent)]" />

      <div className="relative flex h-full flex-col">
        <Link className="block px-1 pb-9" href="/">
          <div className="text-[1.78rem] font-semibold leading-none tracking-[-0.01em] text-white">MaxCinema</div>
          <div className="mt-3 h-px w-12 bg-gradient-to-r from-white/24 to-transparent" />
        </Link>

        <motion.nav animate="show" className="mt-2 space-y-2" initial="hidden">
          {cinematicNav.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(pathname, currentHash, item);

            return (
              <motion.div
                key={item.href}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { delay: 0.035 * index, duration: 0.24 } },
                }}
              >
                <Link
                  className={cn(
                    "group relative flex h-12 items-center gap-4 overflow-hidden rounded-md px-1.5 text-sm font-medium transition duration-300",
                    active ? "bg-white/[0.055] text-white" : "text-white/48 hover:bg-white/[0.032] hover:text-white/82",
                  )}
                  href={item.href}
                  title={item.label}
                >
                  {active ? (
                    <motion.span
                      className="absolute left-0 top-3 h-6 w-0.5 rounded-r-full bg-white/86 shadow-[0_0_12px_rgba(255,255,255,.24)]"
                      layoutId="cinematic-sidebar-active"
                    />
                  ) : null}
                  <motion.span
                    className={cn(
                      "relative grid size-8 place-items-center rounded-md transition",
                      active ? "text-white" : "text-white/34 group-hover:text-white/70",
                    )}
                    whileHover={{ x: 1.5 }}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                  </motion.span>
                  <span className={cn("relative flex-1 tracking-[0.005em]", active && "font-semibold")}>{item.label}</span>
                  <ChevronRight
                    className={cn("relative opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-35", active && "opacity-30")}
                    size={15}
                    strokeWidth={1.6}
                  />
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        <div className="mt-auto pt-5">
          <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <motion.div
            className="group relative overflow-hidden rounded-xl bg-white/[0.032] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.045)] transition hover:bg-white/[0.045]"
            whileHover={{ y: -1 }}
          >
            <div className="absolute -left-8 top-4 size-20 rounded-full bg-white/[0.04] blur-2xl" />
            <Link className="relative flex items-center gap-3" href="/profile">
              <div className="relative grid size-14 place-items-center overflow-hidden rounded-full bg-white/[0.06] text-sm font-semibold text-white ring-1 ring-white/12">
                {profile.avatarUrl ? <img alt="" className="h-full w-full object-cover" src={profile.avatarUrl} /> : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{profile.fullName}</p>
                <p className="mt-1 text-xs font-medium text-white/46">MaxCinema Premium</p>
              </div>
            </Link>
            <form action={signOutAction} className="relative mt-4">
              <button className="flex h-8 items-center gap-2 rounded-md px-1 text-xs font-medium text-white/36 transition hover:text-red-100" type="submit">
                <LogOut size={13} strokeWidth={1.8} />
                Sair
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
