import { Bell, ExternalLink, Menu } from "lucide-react";
import Link from "next/link";
import { AdminCommandSearch } from "@/components/admin/shell/AdminCommandSearch";

export function AdminTopbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-white/10 bg-black/36 px-4 py-4 backdrop-blur-2xl xl:left-72">
      <div className="flex items-center gap-4">
        <button className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-white/75 xl:hidden" type="button">
          <Menu size={19} />
        </button>
        <div className="hidden min-w-0 flex-1 md:block">
          <AdminCommandSearch />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link className="hidden h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/70 transition hover:text-white md:inline-flex" href="/browse">
            Ver plataforma
            <ExternalLink size={15} />
          </Link>
          <button className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-white/70" type="button">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
