import {
  BarChart3,
  Clapperboard,
  Compass,
  Film,
  FolderKanban,
  Home,
  Image,
  Layers,
  Settings,
  Shield,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const nav = [
  { href: "/admin", label: "Visao geral", icon: Compass },
  { href: "/admin/content", label: "Conteudos", icon: Clapperboard },
  { href: "/admin/content/movies", label: "Filmes", icon: Film },
  { href: "/admin/categories", label: "Curadoria", icon: FolderKanban },
  { href: "/admin/collections", label: "Colecoes", icon: Layers },
  { href: "/admin/media", label: "Midia", icon: Image },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: WalletCards },
  { href: "/admin/home-editor", label: "Home Editor", icon: Home },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Sistema", icon: Settings },
];

export function AdminSidebar({
  siteName = "MaxCinema",
  adminLogoUrl = "",
}: {
  siteName?: string;
  adminLogoUrl?: string;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[linear-gradient(180deg,rgba(6,13,20,.92),rgba(3,6,9,.78))] p-5 shadow-[24px_0_80px_rgba(0,0,0,.34)] backdrop-blur-2xl xl:block">
      <Link href="/admin" className="block rounded-xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-cinema-cyan text-slate-950 shadow-[0_0_34px_rgba(19,200,255,.38)]">
            {adminLogoUrl ? <img alt="" className="h-full w-full rounded-lg object-contain" src={adminLogoUrl} /> : <Shield size={21} />}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{siteName}</p>
            <p className="text-xs font-medium text-cinema-cyan">Admin Studio</p>
          </div>
        </div>
        <div className="mt-4 h-px cinema-line opacity-70" />
        <p className="mt-4 text-xs uppercase text-white/45">{siteName} Studio</p>
      </Link>

      <nav className="mt-6 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-sm font-semibold text-white/64 transition hover:border-cinema-cyan/25 hover:bg-white/7 hover:text-white"
              href={item.href}
              key={item.href}
            >
              <Icon className="text-white/42 transition group-hover:text-cinema-cyan" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
