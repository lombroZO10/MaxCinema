import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";
import { recordRecommendationEvent } from "@/services/recommendation/recommendation-events";
import { isUuid } from "@/utils/uuid";

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ favorite: true, demo: true });
  }

  const { movieId, favorite } = await request.json() as { movieId?: string; favorite?: boolean };
  if (!movieId) {
    return NextResponse.json({ error: "movieId is required" }, { status: 400 });
  }

  if (!isUuid(movieId)) {
    return NextResponse.json({ favorite: Boolean(favorite), skipped: "mock-content" });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeProfile = await getActiveViewerProfile();
  if (!activeProfile) {
    return NextResponse.json({ error: "Active profile is required" }, { status: 428 });
  }

  if (favorite) {
    const { error } = await supabase
      .from("favorites")
      .upsert(
        { user_id: userData.user.id, movie_id: movieId, profile_id: activeProfile.id },
        { onConflict: "user_id,movie_id,profile_id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordRecommendationEvent({
      movieId,
      event: "favorite_added",
      sectionSlug: "favorites",
      metadata: { favorite: true },
    });

    return NextResponse.json({ favorite: true });
  }

  const query = supabase
    .from("favorites")
    .delete()
    .eq("user_id", userData.user.id)
    .eq("movie_id", movieId)
    .eq("profile_id", activeProfile.id);

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordRecommendationEvent({
    movieId,
    event: "favorite_removed",
    sectionSlug: "favorites",
    metadata: { favorite: false },
  });

  return NextResponse.json({ favorite: false });
}
