import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogMovies } from "@/services/catalog-service";
import type { Movie } from "@/types/domain";

export type AdminUserRole = "owner" | "admin" | "editor" | "moderator" | "user";
export type AdminUserStatus = "active" | "inactive" | "pending" | "blocked";
export type AdminPlan = "free" | "premium" | "trial" | "canceled" | "unknown";

export type AdminUserIndexItem = {
  id: string;
  userId: string;
  fullName: string;
  emailHint: string;
  avatarUrl?: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  plan: AdminPlan;
  createdAt: string;
  lastSeenAt?: string;
  profileCount: number;
  favoritesCount: number;
  watchedMinutes: number;
  recentFavorites: Movie[];
};

export type AdminUserIndex = {
  updatedAt: string;
  totals: {
    users: number;
    active: number;
    newThisMonth: number;
    admins: number;
    premium: number;
    profiles: number;
    watchedHours: number;
    favorites: number;
  };
  items: AdminUserIndexItem[];
};

export type AdminUserDetails = {
  user: AdminUserIndexItem;
  profiles: {
    id: string;
    name: string;
    avatarUrl?: string;
    profileType: "adult" | "kids";
    lastUsedAt?: string;
    createdAt: string;
  }[];
  favorites: { movie: Movie; createdAt: string }[];
  continueWatching: { movie: Movie; progressPct: number; updatedAt: string }[];
};

type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string | null;
  created_at: string;
  last_seen_at: string | null;
  blocked_at: string | null;
};

type ViewerProfileRow = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  profile_type: "adult" | "kids";
  last_used_at: string | null;
  created_at: string;
};

function monthStartIso(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapPlan(sub?: { status?: string | null; plan_name?: string | null } | null): AdminPlan {
  const status = (sub?.status ?? "").toLowerCase();
  if (!status) return "unknown";
  if (status === "active") return "premium";
  if (status === "trialing") return "trial";
  if (status === "canceled" || status === "cancelled") return "canceled";
  if (status === "past_due") return "premium";
  return "unknown";
}

function mapStatus(row: ProfileRow): AdminUserStatus {
  if (row.blocked_at) return "blocked";
  const status = (row.status ?? "active").toLowerCase();
  if (status === "inactive") return "inactive";
  if (status === "pending") return "pending";
  return "active";
}

function mapRole(role: string): AdminUserRole {
  const normalized = role?.toLowerCase?.() ?? "user";
  if (normalized === "owner") return "owner";
  if (normalized === "admin") return "admin";
  if (normalized === "editor") return "editor";
  if (normalized === "moderator") return "moderator";
  return "user";
}

export async function getAdminUserIndex(): Promise<AdminUserIndex> {
  const updatedAt = new Date().toISOString();

  if (!hasSupabaseEnv()) {
    return {
      updatedAt,
      totals: {
        users: 1,
        active: 1,
        newThisMonth: 1,
        admins: 1,
        premium: 1,
        profiles: 1,
        watchedHours: 0,
        favorites: 0,
      },
      items: [
        {
          id: "mock-admin",
          userId: "mock-admin",
          fullName: "Admin Studio",
          emailHint: "admin@maxcinema.local",
          avatarUrl: undefined,
          role: "admin",
          status: "active",
          plan: "premium",
          createdAt: updatedAt,
          lastSeenAt: updatedAt,
          profileCount: 1,
          favoritesCount: 0,
          watchedMinutes: 0,
          recentFavorites: [],
        },
      ],
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, avatar_url, role, status, created_at, last_seen_at, blocked_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) throw error;

  const rows = (profiles ?? []) as unknown as ProfileRow[];
  const userIds = rows.map((r) => r.user_id);

  const [viewerProfilesResp, favoritesResp, progressResp, subsResp] = await Promise.all([
    supabase.from("viewer_profiles").select("id, user_id, name, avatar_url, profile_type, last_used_at, created_at").in("user_id", userIds),
    supabase.from("favorites").select("user_id, movie_id, created_at").in("user_id", userIds),
    supabase.from("watch_progress").select("user_id, movie_id, progress_seconds, duration_seconds, updated_at").in("user_id", userIds),
    supabase.from("subscriptions").select("user_id, status, plan_name, updated_at").in("user_id", userIds),
  ]);

  const profileCounts = new Map<string, number>();
  const viewerProfileRows = ((viewerProfilesResp.data ?? []) as unknown as ViewerProfileRow[]) ?? [];
  for (const vp of viewerProfileRows) {
    profileCounts.set(vp.user_id, (profileCounts.get(vp.user_id) ?? 0) + 1);
  }

  const favoriteCounts = new Map<string, number>();
  const recentFavoritesRaw = new Map<string, Array<{ movieId: string; createdAt: string }>>();
  const favoriteRows = (favoritesResp.data ?? []) as unknown as { user_id: string; movie_id: string; created_at: string | null }[];
  for (const fav of favoriteRows) {
    const uid = fav.user_id;
    favoriteCounts.set(uid, (favoriteCounts.get(uid) ?? 0) + 1);
    const list = recentFavoritesRaw.get(uid) ?? [];
    list.push({
      movieId: fav.movie_id,
      createdAt: fav.created_at ?? new Date().toISOString(),
    });
    recentFavoritesRaw.set(uid, list);
  }

  const watchedMinutes = new Map<string, number>();
  const progressRows = (progressResp.data ?? []) as unknown as { user_id: string; progress_seconds: number | null }[];
  for (const wp of progressRows) {
    const uid = wp.user_id;
    watchedMinutes.set(uid, (watchedMinutes.get(uid) ?? 0) + Math.floor(Number(wp.progress_seconds ?? 0) / 60));
  }

  const planByUserId = new Map<string, AdminPlan>();
  const subs = (subsResp.data ?? []) as unknown as { user_id: string; status: string | null; plan_name: string | null; updated_at?: string | null }[];
  for (const sub of subs) {
    // Pick the "best" known status; keep latest update if present.
    const current = planByUserId.get(sub.user_id);
    const next = mapPlan(sub);
    if (!current || current === "unknown") planByUserId.set(sub.user_id, next);
  }

  const catalog = await getCatalogMovies({ includeDrafts: true });
  const moviesById = new Map(catalog.map((m) => [m.id, m]));

  const items: AdminUserIndexItem[] = rows.map((row) => {
    const rawFavs = recentFavoritesRaw.get(row.user_id) ?? [];
    rawFavs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const fav of rawFavs) {
      if (seen.has(fav.movieId)) continue;
      seen.add(fav.movieId);
      deduped.push(fav.movieId);
      if (deduped.length >= 6) break;
    }
    const recentFavorites = deduped.map((id) => moviesById.get(id)).filter((m): m is Movie => Boolean(m));
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name || "Usuario MaxCinema",
      emailHint: row.user_id.slice(0, 8),
      avatarUrl: row.avatar_url ?? undefined,
      role: mapRole(row.role),
      status: mapStatus(row),
      plan: planByUserId.get(row.user_id) ?? "unknown",
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at ?? undefined,
      profileCount: profileCounts.get(row.user_id) ?? 0,
      favoritesCount: favoriteCounts.get(row.user_id) ?? 0,
      watchedMinutes: watchedMinutes.get(row.user_id) ?? 0,
      recentFavorites,
    };
  });

  const startMonth = monthStartIso();
  const totals = {
    users: items.length,
    active: items.filter((u) => u.status === "active").length,
    newThisMonth: items.filter((u) => u.createdAt >= startMonth).length,
    admins: items.filter((u) => u.role !== "user").length,
    premium: items.filter((u) => u.plan === "premium" || u.plan === "trial").length,
    profiles: items.reduce((sum, u) => sum + u.profileCount, 0),
    watchedHours: Math.round(items.reduce((sum, u) => sum + u.watchedMinutes, 0) / 60),
    favorites: items.reduce((sum, u) => sum + u.favoritesCount, 0),
  };

  return { updatedAt, totals, items };
}

export async function getAdminUserDetails(userId: string): Promise<AdminUserDetails | null> {
  const index = await getAdminUserIndex();
  const user = index.items.find((u) => u.userId === userId) ?? null;
  if (!user) return null;

  if (!hasSupabaseEnv()) {
    return { user, profiles: [], favorites: [], continueWatching: [] };
  }

  const supabase = await createSupabaseServerClient();
  const catalog = await getCatalogMovies({ includeDrafts: true });
  const moviesById = new Map(catalog.map((m) => [m.id, m]));

  const [profilesResp, favoritesResp, progressResp] = await Promise.all([
    supabase
      .from("viewer_profiles")
      .select("id, user_id, name, avatar_url, profile_type, last_used_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("favorites")
      .select("movie_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("watch_progress")
      .select("movie_id, progress_seconds, duration_seconds, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  const profiles = ((profilesResp.data ?? []) as unknown as ViewerProfileRow[]).map((vp) => ({
    id: vp.id,
    name: vp.name,
    avatarUrl: vp.avatar_url ?? undefined,
    profileType: vp.profile_type,
    lastUsedAt: vp.last_used_at ?? undefined,
    createdAt: vp.created_at,
  }));

  const favoriteDetailRows = (favoritesResp.data ?? []) as unknown as { movie_id: string; created_at: string }[];
  const favorites = favoriteDetailRows
    .map((fav) => {
      const movie = moviesById.get(fav.movie_id);
      if (!movie) return null;
      return { movie, createdAt: fav.created_at };
    })
    .filter((x): x is { movie: Movie; createdAt: string } => Boolean(x));

  const progressDetailRows = (progressResp.data ?? []) as unknown as {
    movie_id: string;
    progress_seconds: number | null;
    duration_seconds: number | null;
    updated_at: string;
  }[];
  const continueWatching = progressDetailRows
    .map((wp) => {
      const movie = moviesById.get(wp.movie_id);
      if (!movie) return null;
      const pct = wp.duration_seconds ? Math.round((Number(wp.progress_seconds ?? 0) / Math.max(Number(wp.duration_seconds), 1)) * 100) : 0;
      return { movie, progressPct: clamp(pct, 0, 100), updatedAt: wp.updated_at };
    })
    .filter((x): x is { movie: Movie; progressPct: number; updatedAt: string } => Boolean(x));

  return { user, profiles, favorites, continueWatching };
}
