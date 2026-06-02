import { NextResponse, type NextRequest } from "next/server";
import { recordRecommendationEvent, type RecommendationEvent } from "@/services/recommendation/recommendation-events";

const allowedEvents = new Set<RecommendationEvent>([
  "shown",
  "clicked",
  "play",
  "progress",
  "completed",
  "favorite_added",
  "favorite_removed",
]);

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    movieId?: string;
    event?: RecommendationEvent;
    sectionSlug?: string;
    score?: number;
    reason?: string;
    metadata?: Record<string, string | number | boolean | null>;
  };

  if (!body.movieId || !body.event) {
    return NextResponse.json({ error: "movieId and event are required" }, { status: 400 });
  }

  if (!allowedEvents.has(body.event)) {
    return NextResponse.json({ error: "Invalid recommendation event" }, { status: 400 });
  }

  const result = await recordRecommendationEvent({
    movieId: body.movieId,
    event: body.event,
    sectionSlug: body.sectionSlug,
    score: body.score,
    reason: body.reason,
    metadata: body.metadata,
  });

  if (!result.ok) {
    if (result.error?.includes("record_recommendation_event")) {
      return NextResponse.json({ ok: false, needsMigration: true, error: result.error });
    }

    if (result.error === "Unauthorized") {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ ok: false, skipped: true, error: result.error });
  }

  return NextResponse.json(result);
}
