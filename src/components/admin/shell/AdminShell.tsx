import type { ReactNode } from "react";
import { AdminConfirmModal } from "@/components/admin/shared/AdminConfirmModal";
import { AdminDrawer } from "@/components/admin/shared/AdminDrawer";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";

export function AdminShell({
  children,
  siteName = "MaxCinema",
  adminLogoUrl = "",
  compactMode = false,
}: {
  children: ReactNode;
  siteName?: string;
  adminLogoUrl?: string;
  compactMode?: boolean;
}) {
  return (
    <div className={compactMode ? "min-h-screen bg-[#030609] text-white text-[14px]" : "min-h-screen bg-[#030609] text-white"}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_78%_0%,rgba(19,200,255,.16),transparent_32rem),radial-gradient(circle_at_12%_20%,rgba(255,159,67,.08),transparent_28rem),linear-gradient(180deg,#06101a,#030609_42%,#020304)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <AdminSidebar adminLogoUrl={adminLogoUrl} siteName={siteName} />
      <AdminTopbar />
      <main className={compactMode ? "relative z-10 px-3 pb-8 pt-20 md:px-6 xl:pl-80" : "relative z-10 px-4 pb-10 pt-24 md:px-8 xl:pl-80"}>
        {children}
      </main>
      <AdminDrawer />
      <AdminConfirmModal />
    </div>
  );
}
