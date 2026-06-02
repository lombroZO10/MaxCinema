import { cookies } from "next/headers";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ViewerProfile, ViewerProfileType } from "@/types/domain";

export const ACTIVE_PROFILE_COOKIE = "maxcinema_active_profile";

export const profileAvatars = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&h=240&q=86",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&h=240&q=86",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&h=240&q=86",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=86",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=240&h=240&q=86",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&h=240&q=86",
];

export const profileThemeColors = ["#13c8ff", "#f4b860", "#8f7cff", "#f06f8f", "#45d483", "#ffffff"];

const mockViewerProfiles: ViewerProfile[] = [
  {
    id: "demo-main-profile",
    accountId: "demo-account",
    userId: "mock-user",
    name: "Principal",
    avatarUrl: profileAvatars[0],
    profileType: "adult",
    themeColor: profileThemeColors[0],
    language: "pt-BR",
    maturityLimit: "18",
    autoplayEnabled: true,
    trailerAutoplayEnabled: true,
    lastUsedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

type ViewerProfileRow = {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  profile_type: ViewerProfileType;
  theme_color: string | null;
  language: string | null;
  maturity_limit: string | null;
  autoplay_enabled: boolean | null;
  trailer_autoplay_enabled: boolean | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapViewerProfile(row: ViewerProfileRow): ViewerProfile {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    name: row.name,
    avatarUrl: row.avatar_url || profileAvatars[0],
    profileType: row.profile_type,
    themeColor: row.theme_color || profileThemeColors[0],
    language: row.language || "pt-BR",
    maturityLimit: row.maturity_limit || "18",
    autoplayEnabled: row.autoplay_enabled ?? true,
    trailerAutoplayEnabled: row.trailer_autoplay_enabled ?? true,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getViewerProfiles(): Promise<ViewerProfile[]> {
  if (!hasSupabaseEnv()) return mockViewerProfiles;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data } = await supabase
      .from("viewer_profiles")
      .select("id, account_id, user_id, name, avatar_url, profile_type, theme_color, language, maturity_limit, autoplay_enabled, trailer_autoplay_enabled, last_used_at, created_at, updated_at")
      .eq("user_id", userData.user.id)
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true });

    return (data ?? []).map((row) => mapViewerProfile(row as ViewerProfileRow));
  } catch {
    return [];
  }
}

export async function getViewerProfileById(profileId: string): Promise<ViewerProfile | null> {
  const profiles = await getViewerProfiles();
  return profiles.find((profile) => profile.id === profileId) ?? null;
}

export async function getActiveViewerProfile(): Promise<ViewerProfile | null> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (!profileId) return null;
  return getViewerProfileById(profileId);
}
