import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/browse", "/movie", "/watch", "/favorites", "/profile", "/admin", "/continue-watching", "/profiles", "/kids"];
const activeProfileRoutes = ["/browse", "/movie", "/watch", "/favorites", "/profile", "/continue-watching", "/kids"];
const adminRoutes = ["/admin"];
const maintenanceAllowedRoutes = ["/admin", "/login", "/profiles", "/maintenance", "/api"];
const adminRoles = new Set(["owner", "admin", "editor", "moderator"]);

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function proxy(request: NextRequest) {
  const hasSupabaseEnv = process.env.MAXCINEMA_DEMO_MODE !== "1" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isProtected = protectedRoutes.some((route) => matchesRoute(request.nextUrl.pathname, route));
  const needsActiveProfile = activeProfileRoutes.some((route) => matchesRoute(request.nextUrl.pathname, route));
  const isAdminRoute = adminRoutes.some((route) => matchesRoute(request.nextUrl.pathname, route));
  const isMaintenanceAllowed = maintenanceAllowedRoutes.some((route) => matchesRoute(request.nextUrl.pathname, route));
  let profileRole: string | null = null;

  const { data: maintenanceSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance.enabled")
    .maybeSingle();

  const maintenanceEnabled = maintenanceSetting?.value === true || maintenanceSetting?.value === "true";

  if (maintenanceEnabled && data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
  }

  if (maintenanceEnabled && !isMaintenanceAllowed && (!profileRole || !adminRoles.has(profileRole))) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  if (isProtected && !data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const activeProfileId = request.cookies.get("maxcinema_active_profile")?.value;

  if (data.user && (needsActiveProfile || isAdminRoute)) {
    if (!activeProfileId) {
      return NextResponse.redirect(new URL("/profiles", request.url));
    }

    const { data: activeProfile } = await supabase
      .from("viewer_profiles")
      .select("id, profile_type")
      .eq("id", activeProfileId)
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!activeProfile) {
      const redirectResponse = NextResponse.redirect(new URL("/profiles", request.url));
      redirectResponse.cookies.delete("maxcinema_active_profile");
      return redirectResponse;
    }

    if (isAdminRoute && activeProfile.profile_type === "kids") {
      return NextResponse.redirect(new URL("/browse", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
