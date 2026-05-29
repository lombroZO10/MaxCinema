import {
  Film,
  Heart,
  Home,
  Library,
  Search,
  Settings,
  Sparkles,
  Tv,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { profile } from "@/services/content-service";

const nav = [
  { href: "/browse", label: "Inicio", icon: Home },
  { href: "/browse#filmes", label: "Filmes", icon: Film },
  { href: "/browse#series", label: "Series", icon: Tv },
  { href: "/browse#originais", label: "Originais", icon: Sparkles },
  { href: "/favorites", label: "Minha lista", icon: Heart },
  { href: "/continue-watching", label: "Continuar", icon: Library },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="cinema-bg min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-black/42 p-6 backdrop-blur-2xl xl:block">
        <Link href="/" className="block">
          <div className="text-3xl font-semibold text-white">MaxCinema</div>
          <div className="mt-1 text-sm font-medium text-cinema-cyan">Cinema OS 2026</div>
        </Link>
        <nav className="mt-14 space-y-2">
          {nav.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-3 text-sm font-medium text-white/72 transition hover:border-cinema-cyan/30 hover:bg-white/8 hover:text-white"
                href={item.href}
                key={item.href}
              >
                <Icon className={index === 0 ? "text-cinema-cyan" : ""} size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-6 right-6 border-t border-white/10 pt-6">
          <Link className="flex items-center gap-3" href="/profile">
            <img alt="" className="size-12 rounded-full object-cover ring-1 ring-white/15" src={profile.avatarUrl} />
            <div>
              <p className="text-sm font-semibold text-white">{profile.fullName}</p>
              <p className="text-xs text-cinema-cyan">{profile.plan}</p>
            </div>
          </Link>
          <form action={signOutAction}>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-white/48 transition hover:text-white" type="submit">
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-5 backdrop-blur-sm md:px-10 xl:left-64">
        <Link className="font-semibold text-white xl:hidden" href="/">
          MaxCinema
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <label className="hidden h-11 w-[320px] items-center gap-3 rounded-md border border-white/10 bg-black/34 px-4 text-sm text-white/50 backdrop-blur md:flex">
            <Search size={18} />
            <span>Buscar</span>
          </label>
          <Link className="grid size-11 place-items-center rounded-md border border-white/10 bg-black/34 text-white/76 backdrop-blur" href="/profile">
            <User size={18} />
          </Link>
        </div>
      </header>

      <div className="xl:pl-64">{children}</div>
    </div>
  );
}
