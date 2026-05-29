"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slug";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function intOrNull(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function uploadAsset(formData: FormData, key: string, folder: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;

  const supabase = await createSupabaseServerClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function createMovieAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/admin/movies?demo=1");
  }

  const title = text(formData, "title");
  const description = text(formData, "description");
  const rawSlug = text(formData, "slug");
  const genreName = text(formData, "genre");
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);

  const supabase = await createSupabaseServerClient();
  const [posterUrl, backdropUrl, trailerUrl] = await Promise.all([
    uploadAsset(formData, "poster", "posters"),
    uploadAsset(formData, "backdrop", "backdrops"),
    uploadAsset(formData, "trailer", "trailers"),
  ]);

  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .insert({
      title,
      slug,
      description,
      type: text(formData, "type") === "series" ? "series" : "movie",
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      trailer_url: trailerUrl,
      mux_playback_id: text(formData, "muxPlaybackId") || null,
      release_year: intOrNull(text(formData, "releaseYear")),
      duration_minutes: intOrNull(text(formData, "durationMinutes")),
      maturity_rating: text(formData, "maturityRating") || null,
      featured: formData.get("featured") === "on",
      status: text(formData, "status") === "published" ? "published" : "draft",
    })
    .select("id")
    .single();

  if (movieError) {
    redirect(`/admin/movies/new?error=${encodeURIComponent(movieError.message)}`);
  }

  if (genreName && movie) {
    const genreSlug = slugify(genreName);
    const { data: genre } = await supabase
      .from("genres")
      .upsert({ name: genreName, slug: genreSlug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (genre) {
      await supabase.from("movie_genres").upsert({ movie_id: movie.id, genre_id: genre.id });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/movies");
  revalidatePath("/browse");
  redirect("/admin/movies");
}

export async function updateMovieAction(movieId: string, formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/admin/movies?demo=1");
  }

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("movies")
    .update({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      description: text(formData, "description"),
      type: text(formData, "type") === "series" ? "series" : "movie",
      mux_playback_id: text(formData, "muxPlaybackId") || null,
      release_year: intOrNull(text(formData, "releaseYear")),
      duration_minutes: intOrNull(text(formData, "durationMinutes")),
      maturity_rating: text(formData, "maturityRating") || null,
      featured: formData.get("featured") === "on",
      status: text(formData, "status") === "published" ? "published" : "draft",
    })
    .eq("id", movieId);

  if (error) {
    redirect(`/admin/movies/${movieId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/movies");
  revalidatePath("/browse");
  redirect("/admin/movies");
}
