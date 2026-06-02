import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell/AdminShell";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { getSettingValue, getSettings } from "@/services/settings/settings-service";

const ADMIN_READ_ROLES = new Set(["owner", "admin", "editor", "moderator"]);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status, blocked_at")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile || !ADMIN_READ_ROLES.has(profile.role) || profile.status !== "active" || profile.blocked_at) {
      redirect("/browse");
    }

    const viewerProfile = await getActiveViewerProfile();
    if (viewerProfile?.profileType === "kids") {
      redirect("/browse");
    }
  }

  const settings = await getSettings();
  return (
    <AdminShell
      adminLogoUrl={getSettingValue(settings, "identity.adminLogoUrl", "")}
      compactMode={getSettingValue(settings, "admin.compactMode", false)}
      siteName={getSettingValue(settings, "general.siteName", "MaxCinema")}
    >
      {children}
    </AdminShell>
  );
}
