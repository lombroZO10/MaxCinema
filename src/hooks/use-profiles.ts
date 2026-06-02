"use client";

import { useActiveProfile } from "@/hooks/use-active-profile";

export function useProfiles() {
  return useActiveProfile();
}

export function useCreateProfile() {
  return { pending: false };
}

export function useUpdateProfile() {
  return { pending: false };
}

export function useProfileGate() {
  const { profile, loading } = useActiveProfile();
  return { profile, loading, needsProfile: !loading && !profile };
}
