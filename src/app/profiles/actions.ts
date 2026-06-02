"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_PROFILE_COOKIE, profileAvatars, profileThemeColors } from "@/services/profile/viewer-profile-service";
import type { ViewerProfileType } from "@/types/domain";

function getString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id };
}

async function ensureAccount(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("accounts")
    .insert({ owner_user_id: userId, plan: "premium" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

async function setActiveProfileCookie(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function selectViewerProfileAction(formData: FormData) {
  const profileId = getString(formData, "profileId");

  if (!profileId) {
    redirect("/profiles");
  }

  if (hasSupabaseEnv()) {
    const { supabase, userId } = await getCurrentUserId();
    if (!userId) redirect("/login");

    const { data } = await supabase
      .from("viewer_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) redirect("/profiles");

    await supabase
      .from("viewer_profiles")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", profileId)
      .eq("user_id", userId);
  }

  await setActiveProfileCookie(profileId);
  redirect("/browse");
}

export async function clearActiveProfileAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_PROFILE_COOKIE);
  redirect("/profiles");
}

export async function createViewerProfileAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    await setActiveProfileCookie("demo-main-profile");
    redirect("/browse");
  }

  const { supabase, userId } = await getCurrentUserId();
  if (!userId) redirect("/login");

  const accountId = await ensureAccount(supabase, userId);
  const name = getString(formData, "name", "Perfil");
  const avatarUrl = getString(formData, "avatarUrl", profileAvatars[0]);
  const profileType = getString(formData, "profileType", "adult") as ViewerProfileType;
  const themeColor = getString(formData, "themeColor", profileThemeColors[0]);
  const language = getString(formData, "language", "pt-BR");
  const maturityLimit = getString(formData, "maturityLimit", profileType === "kids" ? "10" : "18");

  const { data, error } = await supabase
    .from("viewer_profiles")
    .insert({
      account_id: accountId,
      user_id: userId,
      name,
      avatar_url: avatarUrl,
      profile_type: profileType,
      theme_color: themeColor,
      language,
      maturity_limit: maturityLimit,
      autoplay_enabled: getBoolean(formData, "autoplayEnabled"),
      trailer_autoplay_enabled: getBoolean(formData, "trailerAutoplayEnabled"),
      last_used_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) redirect(`/profiles/new?error=${encodeURIComponent(error.message)}`);

  await setActiveProfileCookie(data.id);
  redirect("/browse");
}

export async function updateViewerProfileAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/profiles/manage");

  const profileId = getString(formData, "profileId");
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) redirect("/login");

  const profileType = getString(formData, "profileType", "adult") as ViewerProfileType;
  const { error } = await supabase
    .from("viewer_profiles")
    .update({
      name: getString(formData, "name", "Perfil"),
      avatar_url: getString(formData, "avatarUrl", profileAvatars[0]),
      profile_type: profileType,
      theme_color: getString(formData, "themeColor", profileThemeColors[0]),
      language: getString(formData, "language", "pt-BR"),
      maturity_limit: getString(formData, "maturityLimit", profileType === "kids" ? "10" : "18"),
      autoplay_enabled: getBoolean(formData, "autoplayEnabled"),
      trailer_autoplay_enabled: getBoolean(formData, "trailerAutoplayEnabled"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", userId);

  if (error) redirect(`/profiles/${profileId}/edit?error=${encodeURIComponent(error.message)}`);
  redirect("/profiles/manage");
}

export async function deleteViewerProfileAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/profiles/manage");

  const profileId = getString(formData, "profileId");
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { count } = await supabase
    .from("viewer_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) <= 1) {
    redirect(`/profiles/manage?error=${encodeURIComponent("Crie outro perfil antes de excluir o ultimo.")}`);
  }

  await supabase.from("viewer_profiles").delete().eq("id", profileId).eq("user_id", userId);

  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value === profileId) {
    cookieStore.delete(ACTIVE_PROFILE_COOKIE);
  }

  redirect("/profiles/manage");
}
