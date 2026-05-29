"use server";

import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/browse?demo=1");
  }

  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email ou senha invalidos.")}`);
  }

  redirect("/browse");
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/browse?demo=1");
  }

  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/browse");
}

export async function signOutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
