import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { isUuid } from "@/utils/uuid";

export type RecommendationEvent =
  | "view"
  | "click"
  | "shown"
  | "clicked"
  | "play"
  | "progress"
  | "completed"
  | "favorite_added"
  | "favorite_removed"
  | "dismiss";

export type RecommendationEventPayload = {
  movieId: string;
  event: RecommendationEvent;
  sectionSlug?: string;
  score?: number;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordRecommendationEvent({
  movieId,
  event,
  sectionSlug = "unknown",
  score = 0,
  reason,
  metadata = {},
}: RecommendationEventPayload) {
  if (!hasSupabaseEnv() || !isUuid(movieId)) {
    return { ok: true, skipped: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const activeProfile = await getActiveViewerProfile();

  if (!userData.user) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!activeProfile) {
    return { ok: false, error: "Active profile is required" };
  }

  const rpcEvent = event === "view" ? "shown" : event === "click" ? "clicked" : event;
  const { error } = await supabase.rpc("record_recommendation_event", {
    p_user_id: userData.user.id,
    p_profile_id: activeProfile.id,
    p_movie_id: movieId,
    p_event: rpcEvent,
    p_section_slug: sectionSlug,
    p_recommendation_score: score,
    p_reason: reason,
    p_metadata: { ...metadata, eventType: event },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
