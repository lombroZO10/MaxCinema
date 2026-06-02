import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profile as mockProfile } from "@/services/content-service";
import type { Profile, UserRole } from "@/types/domain";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=86";

export async function getCurrentProfile(): Promise<Profile> {
  if (!hasSupabaseEnv()) return mockProfile;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return mockProfile;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, avatar_url, role, status, blocked_at, last_seen_at")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile) return mockProfile;

    return {
      id: profile.id,
      userId: profile.user_id,
      fullName: profile.full_name || userData.user.email || "Usuario MaxCinema",
      avatarUrl: profile.avatar_url || fallbackAvatar,
      role: profile.role as UserRole,
      status: profile.status ?? "active",
      blockedAt: profile.blocked_at ?? undefined,
      lastSeenAt: profile.last_seen_at ?? undefined,
      plan: "Plano Premium",
    };
  } catch {
    return mockProfile;
  }
}
