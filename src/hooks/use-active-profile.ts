"use client";

import { useEffect, useState } from "react";
import type { ViewerProfile } from "@/types/domain";

export function useActiveProfile() {
  const [profile, setProfile] = useState<ViewerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/profiles/active")
      .then((response) => response.json())
      .then((payload: { profile: ViewerProfile | null }) => {
        if (active) setProfile(payload.profile);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { profile, loading };
}
