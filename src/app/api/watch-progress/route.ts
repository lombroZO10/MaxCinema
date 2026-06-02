import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { recordRecommendationEvent } from "@/services/recommendation/recommendation-events";
import { isUuid } from "@/utils/uuid";

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const body = await request.json() as {
    movieId?: string;
    progressSeconds?: number;
    durationSeconds?: number;
  };

  if (!body.movieId) {
    return NextResponse.json({ error: "movieId is required" }, { status: 400 });
  }

  if (!isUuid(body.movieId)) {
    return NextResponse.json({ ok: true, skipped: "mock-content" });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progressSeconds = Math.max(0, Math.floor(body.progressSeconds ?? 0));
  const durationSeconds = Math.max(0, Math.floor(body.durationSeconds ?? 0));
  const activeProfile = await getActiveViewerProfile();

  if (!activeProfile) {
    return NextResponse.json({ error: "Active profile is required" }, { status: 428 });
  }

  const { error } = await supabase
    .from("watch_progress")
    .upsert(
      {
        user_id: userData.user.id,
        movie_id: body.movieId,
        profile_id: activeProfile.id,
        progress_seconds: progressSeconds,
        duration_seconds: durationSeconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id,profile_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const completionRatio = durationSeconds > 0 ? progressSeconds / durationSeconds : 0;
  await supabase.from("content_views").insert({
    user_id: userData.user.id,
    profile_id: activeProfile.id,
    movie_id: body.movieId,
    source: "player",
    watch_seconds: progressSeconds,
    completed: completionRatio >= 0.85,
    metadata: {
      durationSeconds,
      completionRatio: Math.round(completionRatio * 100) / 100,
    },
  });

  await recordRecommendationEvent({
    movieId: body.movieId,
    event: completionRatio >= 0.85 ? "completed" : "progress",
    sectionSlug: "player",
    score: Math.round(completionRatio * 100),
    metadata: {
      progressSeconds,
      durationSeconds,
      completionRatio: Math.round(completionRatio * 100) / 100,
    },
  });

  return NextResponse.json({ ok: true });
}
