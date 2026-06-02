export function hasSupabaseEnv() {
  if (process.env.MAXCINEMA_DEMO_MODE === "1") return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function requireSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}
