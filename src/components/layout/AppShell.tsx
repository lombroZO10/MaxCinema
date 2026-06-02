import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { cinematicNav } from "@/components/layout/sidebar-nav";
import { StreamingTopNav } from "@/components/layout/StreamingTopNav";
import { getCurrentProfile } from "@/services/profile-service";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";

export async function AppShell({
  children,
  searchQuery = "",
}: {
  children: ReactNode;
  searchQuery?: string;
}) {
  const [profile, viewerProfile, settings] = await Promise.all([getCurrentProfile(), getActiveViewerProfile(), getPublicSettings()]);
  const navItems = cinematicNav.filter((item) => {
    if (!item.settingKey) return true;
    return getSettingValue(settings, item.settingKey, true);
  });

  return (
    <div className="cinema-bg min-h-screen pb-20 xl:pb-0">
      <StreamingTopNav
        enabledNavHrefs={navItems.map((item) => item.href)}
        logoUrl={getSettingValue(settings, "identity.logoUrl", "")}
        profile={profile}
        searchQuery={searchQuery}
        signOutAction={signOutAction}
        siteName={getSettingValue(settings, "general.siteName", "MaxCinema")}
        viewerProfile={viewerProfile}
      />

      <div>{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/72 px-3 py-2 backdrop-blur-2xl xl:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.filter((item) => item.href !== "/admin").slice(0, 5).map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                aria-label={item.label}
                className="flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold text-white/62 transition hover:bg-white/8 hover:text-white"
                href={item.href}
                key={item.href}
              >
                <Icon className={index === 0 ? "text-cinema-cyan" : ""} size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
