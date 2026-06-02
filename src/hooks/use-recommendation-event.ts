"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RecommendationEvent } from "@/services/recommendation/recommendation-events";

type EventPayload = {
  movieId: string;
  event: RecommendationEvent;
  sectionSlug?: string;
  score?: number;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function sendRecommendationEvent(payload: EventPayload) {
  return fetch("/api/recommendation-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => null);
}

export function useRecommendationEvent(basePayload: Omit<EventPayload, "event">) {
  return useCallback(
    (event: RecommendationEvent, metadata?: EventPayload["metadata"]) =>
      sendRecommendationEvent({
        ...basePayload,
        event,
        metadata: {
          ...basePayload.metadata,
          ...metadata,
        },
      }),
    [basePayload],
  );
}

export function useRecommendationImpression(basePayload: Omit<EventPayload, "event">) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendRecommendationEvent({ ...basePayload, event: "shown" });
  }, [basePayload]);
}
