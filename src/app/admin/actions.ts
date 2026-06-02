"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, getSettingValue, getSettings, resetSettings, updateSettingsBulk } from "@/services/settings/settings-service";
import { slugify } from "@/utils/slug";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function intOrNull(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const ADMIN_WRITE_ROLES = new Set(["owner", "admin", "editor"]);
const IMAGE_UPLOAD_FOLDERS = new Set(["posters", "backdrops", "collection-banners", "collection-covers", "system-assets"]);
const VIDEO_UPLOAD_FOLDERS = new Set(["trailers"]);

function fileExtension(file: File) {
  return (file.name.split(".").pop() ?? "").toLowerCase();
}

async function validateUploadFile(file: File, key: string, folder: string) {
  const settings = await getSettings();
  const extension = fileExtension(file);
  const sizeMb = file.size / 1024 / 1024;

  if (IMAGE_UPLOAD_FOLDERS.has(folder)) {
    const allowed = getSettingValue(settings, "media.allowedImageFormats", "jpg,jpeg,png,webp,avif")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const maxMb = folder === "posters" || folder === "collection-covers"
      ? getSettingValue(settings, "media.maxPosterMb", 10)
      : getSettingValue(settings, "media.maxBackdropMb", 12);

    if (!file.type.startsWith("image/")) {
      throw new Error("Arquivo invalido: envie uma imagem.");
    }
    if (!allowed.includes(extension)) {
      throw new Error(`Formato invalido para ${key}. Permitidos: ${allowed.join(", ")}.`);
    }
    if (sizeMb > maxMb) {
      throw new Error(`Arquivo muito grande para ${key}. Limite: ${maxMb}MB.`);
    }
  }

  if (VIDEO_UPLOAD_FOLDERS.has(folder)) {
    const allowedVideo = new Set(["mp4", "mov", "webm", "m3u8"]);
    if (!allowedVideo.has(extension)) {
      throw new Error("Formato de video invalido. Permitidos: mp4, mov, webm, m3u8.");
    }
  }
}

async function uploadAsset(formData: FormData, key: string, folder: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  await validateUploadFile(file, key, folder);

  const supabase = await createSupabaseServerClient();
  const extension = fileExtension(file) || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  await supabase.from("media_assets").insert({
    url: data.publicUrl,
    path,
    bucket: "media",
    type: folder.replace(/s$/, ""),
    mime_type: file.type || null,
    size: file.size,
    usage: key,
  });

  return data.publicUrl;
}

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, blocked_at")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile || !ADMIN_WRITE_ROLES.has(profile.role) || profile.status !== "active" || profile.blocked_at) {
    redirect("/browse");
  }

  return { supabase, userId: userData.user.id };
}

async function recordActivity({
  userId,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("content_activity").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}

function revalidateAdminContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/admin/content/movies");
  revalidatePath("/admin/content/series");
  revalidatePath("/admin/home-editor");
  revalidatePath("/browse");
}

function revalidateSystemSettings() {
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/login");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}

function parseIds(formData: FormData) {
  const raw = text(formData, "ids");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function redirectTo(formData: FormData, fallback: string) {
  const to = text(formData, "redirectTo");
  return to.startsWith("/") ? to : fallback;
}

export async function updateSystemSettingsAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/settings?demo=1");

  const raw = text(formData, "settingsJson");
  const nextPath = redirectTo(formData, "/admin/settings");
  if (!raw) redirect(`${nextPath}?error=${encodeURIComponent("Nenhuma configuracao enviada.")}`);

  let values: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    values = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    redirect(`${nextPath}?error=${encodeURIComponent("JSON de configuracoes invalido.")}`);
  }

  const allowedKeys = new Set(Object.keys(DEFAULT_SETTINGS));
  const filtered = Object.fromEntries(Object.entries(values).filter(([key]) => allowedKeys.has(key)));
  if (!Object.keys(filtered).length) redirect(`${nextPath}?error=${encodeURIComponent("Nenhuma chave valida para salvar.")}`);

  const { userId } = await assertAdmin();

  try {
    await updateSettingsBulk(filtered, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar configuracoes.";
    redirect(`${nextPath}?error=${encodeURIComponent(message)}`);
  }

  await recordActivity({
    userId,
    action: "system_settings.updated",
    entityType: "site_settings",
    metadata: { count: Object.keys(filtered).length },
  });
  revalidateSystemSettings();
  redirect(`${nextPath}?saved=1`);
}

export async function resetSystemSettingsAction() {
  if (!hasSupabaseEnv()) redirect("/admin/settings?demo=1");

  const { userId } = await assertAdmin();
  try {
    await resetSettings(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao resetar configuracoes.";
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  await recordActivity({
    userId,
    action: "system_settings.reset",
    entityType: "site_settings",
    metadata: { count: Object.keys(DEFAULT_SETTINGS).length },
  });
  revalidateSystemSettings();
  redirect("/admin/settings?saved=reset");
}

export async function resetSystemSettingsSectionAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/settings?demo=1");

  const group = text(formData, "group");
  const values = Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS)
      .filter(([, setting]) => setting.group === group)
      .map(([key, setting]) => [key, setting.value]),
  );
  if (!Object.keys(values).length) redirect(`/admin/settings?error=${encodeURIComponent("Secao invalida para reset.")}`);

  const { userId } = await assertAdmin();
  try {
    await updateSettingsBulk(values, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao resetar secao.";
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  await recordActivity({
    userId,
    action: "system_settings.section_reset",
    entityType: "site_settings",
    metadata: { group, count: Object.keys(values).length },
  });
  revalidateSystemSettings();
  redirect("/admin/settings?saved=section-reset");
}

export async function uploadSystemAssetAction(settingKey: string, assetField: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/settings?demo=1");

  const { userId } = await assertAdmin();
  let assetUrl: string | null = null;
  try {
    assetUrl = await uploadAsset(formData, assetField, "system-assets");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar arquivo.";
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  if (!assetUrl) redirect("/admin/settings");

  try {
    await updateSettingsBulk({ [settingKey]: assetUrl }, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar asset.";
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  await recordActivity({
    userId,
    action: "system_settings.asset_uploaded",
    entityType: "site_settings",
    metadata: { settingKey },
  });
  revalidateSystemSettings();
  redirect("/admin/settings?saved=asset");
}

export async function bulkPublishMoviesAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content?demo=1");
  const ids = parseIds(formData);
  const nextPath = redirectTo(formData, "/admin/content");
  if (!ids.length) redirect(nextPath);

  const { supabase, userId } = await assertAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("movies")
    .update({ status: "published", published_at: now, updated_by: userId })
    .in("id", ids);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "movies.bulk_published",
    entityType: "movies",
    metadata: { count: ids.length },
  });
  revalidateAdminContent();
  redirect(nextPath);
}

export async function bulkUnpublishMoviesAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content?demo=1");
  const ids = parseIds(formData);
  const nextPath = redirectTo(formData, "/admin/content");
  if (!ids.length) redirect(nextPath);

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({ status: "draft", published_at: null, updated_by: userId })
    .in("id", ids);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "movies.bulk_unpublished",
    entityType: "movies",
    metadata: { count: ids.length },
  });
  revalidateAdminContent();
  redirect(nextPath);
}

export async function bulkFeatureMoviesAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content?demo=1");
  const ids = parseIds(formData);
  const featured = text(formData, "featured") === "true";
  const nextPath = redirectTo(formData, "/admin/content");
  if (!ids.length) redirect(nextPath);

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({ featured, updated_by: userId })
    .in("id", ids);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: featured ? "movies.bulk_featured" : "movies.bulk_unfeatured",
    entityType: "movies",
    metadata: { count: ids.length },
  });
  revalidateAdminContent();
  redirect(nextPath);
}

export async function bulkDeleteMoviesAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content?demo=1");
  const ids = parseIds(formData);
  const nextPath = redirectTo(formData, "/admin/content");
  if (!ids.length) redirect(nextPath);

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("movies").delete().in("id", ids);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "movies.bulk_deleted",
    entityType: "movies",
    metadata: { count: ids.length },
  });
  revalidateAdminContent();
  redirect(nextPath);
}

function revalidateEditorial() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/home-editor");
  revalidatePath("/admin/users");
  revalidatePath("/browse");
  revalidatePath("/browse/collections");
}

export async function createMovieAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/admin/content/movies?demo=1");
  }

  const title = text(formData, "title");
  const description = text(formData, "description");
  const rawSlug = text(formData, "slug");
  const genreName = text(formData, "genre");
  const intent = text(formData, "intent");
  const requestedStatus = text(formData, "status") === "published" ? "published" : "draft";
  const status = intent === "publish" ? "published" : intent === "draft" ? "draft" : requestedStatus;
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);

  const { supabase, userId } = await assertAdmin();
  let posterUrl: string | null = null;
  let backdropUrl: string | null = null;
  let trailerUrl: string | null = null;
  try {
    [posterUrl, backdropUrl, trailerUrl] = await Promise.all([
      uploadAsset(formData, "poster", "posters"),
      uploadAsset(formData, "backdrop", "backdrops"),
      uploadAsset(formData, "trailer", "trailers"),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar midia.";
    redirect(`/admin/content/new?error=${encodeURIComponent(message)}`);
  }
  const manualTrailerUrl = text(formData, "trailerUrl");

  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .insert({
      title,
      slug,
      description,
      type: text(formData, "type") === "series" ? "series" : "movie",
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      trailer_url: (trailerUrl ?? manualTrailerUrl) || null,
      mux_playback_id: text(formData, "muxPlaybackId") || null,
      release_year: intOrNull(text(formData, "releaseYear")),
      duration_minutes: intOrNull(text(formData, "durationMinutes")),
      maturity_rating: text(formData, "maturityRating") || null,
      seo_title: text(formData, "seoTitle") || null,
      seo_description: text(formData, "seoDescription") || null,
      featured: formData.get("featured") === "on",
      is_original: formData.get("isOriginal") === "on",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (movieError) {
    redirect(`/admin/content/new?error=${encodeURIComponent(movieError.message)}`);
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

  if (movie) {
    await recordActivity({
      userId,
      action: "content.created",
      entityType: "movie",
      entityId: movie.id,
      metadata: { title, status },
    });
  }

  revalidateAdminContent();
  redirect(movie?.id ? `/admin/content/${movie.id}/edit?from=new` : "/admin/content/movies");
}

export async function updateMovieAction(movieId: string, formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/admin/content/movies?demo=1");
  }

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const { supabase, userId } = await assertAdmin();
  let posterUrl: string | null = null;
  let backdropUrl: string | null = null;
  let trailerUploadUrl: string | null = null;
  try {
    [posterUrl, backdropUrl, trailerUploadUrl] = await Promise.all([
      uploadAsset(formData, "poster", "posters"),
      uploadAsset(formData, "backdrop", "backdrops"),
      uploadAsset(formData, "trailer", "trailers"),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar midia.";
    redirect(`/admin/content/${movieId}/edit?error=${encodeURIComponent(message)}`);
  }
  const trailerUrl = (trailerUploadUrl ?? text(formData, "trailerUrl")) || null;

  const { error } = await supabase
    .from("movies")
    .update({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      description: text(formData, "description"),
      type: text(formData, "type") === "series" ? "series" : "movie",
      ...(posterUrl ? { poster_url: posterUrl } : {}),
      ...(backdropUrl ? { backdrop_url: backdropUrl } : {}),
      trailer_url: trailerUrl,
      mux_playback_id: text(formData, "muxPlaybackId") || null,
      release_year: intOrNull(text(formData, "releaseYear")),
      duration_minutes: intOrNull(text(formData, "durationMinutes")),
      maturity_rating: text(formData, "maturityRating") || null,
      seo_title: text(formData, "seoTitle") || null,
      seo_description: text(formData, "seoDescription") || null,
      featured: formData.get("featured") === "on",
      status: text(formData, "status") === "published" ? "published" : "draft",
      published_at: text(formData, "status") === "published" ? new Date().toISOString() : null,
      updated_by: userId,
    })
    .eq("id", movieId);

  if (error) {
    redirect(`/admin/content/${movieId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  await recordActivity({
    userId,
    action: "content.updated",
    entityType: "movie",
    entityId: movieId,
    metadata: { title, status: text(formData, "status") || "draft" },
  });

  revalidateAdminContent();
  redirect("/admin/content/movies");
}

export async function patchMovieBasicsAction(movieId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const title = text(formData, "title");
  const status = text(formData, "status") === "published" ? "published" : "draft";
  const featured = formData.get("featured") === "on";
  const isOriginal = formData.get("isOriginal") === "on";
  const nextPath = redirectTo(formData, "/admin/content/movies");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({
      ...(title ? { title } : {}),
      status,
      featured,
      is_original: isOriginal,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_by: userId,
    })
    .eq("id", movieId);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "content.quick_updated",
    entityType: "movie",
    entityId: movieId,
    metadata: { status, featured, isOriginal },
  });

  revalidateAdminContent();
  redirect(nextPath);
}

export async function setMoviePrimaryGenreAction(movieId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const genreSlug = slugify(text(formData, "genreSlug"));
  const genreName = text(formData, "genreName");
  const nextPath = redirectTo(formData, "/admin/content/movies");

  const { supabase, userId } = await assertAdmin();

  const { error: clearError } = await supabase.from("movie_genres").delete().eq("movie_id", movieId);
  if (clearError) redirect(`${nextPath}?error=${encodeURIComponent(clearError.message)}`);

  if (genreSlug) {
    const name = genreName || genreSlug.replace(/-/g, " ");
    const { data: genre, error: genreError } = await supabase
      .from("genres")
      .upsert({ name, slug: genreSlug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (genreError || !genre) {
      redirect(`${nextPath}?error=${encodeURIComponent(genreError?.message ?? "Falha ao salvar categoria")}`);
    }

    const { error: linkError } = await supabase.from("movie_genres").insert({ movie_id: movieId, genre_id: genre.id });
    if (linkError) redirect(`${nextPath}?error=${encodeURIComponent(linkError.message)}`);
  }

  await recordActivity({
    userId,
    action: "content.genre_set",
    entityType: "movie",
    entityId: movieId,
    metadata: { genreSlug: genreSlug || null },
  });

  revalidateAdminContent();
  redirect(nextPath);
}

export async function publishMovieAction(movieId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", movieId);

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "content.published", entityType: "movie", entityId: movieId });
  revalidateAdminContent();
}

export async function unpublishMovieAction(movieId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({
      status: "draft",
      published_at: null,
      updated_by: userId,
    })
    .eq("id", movieId);

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "content.unpublished", entityType: "movie", entityId: movieId });
  revalidateAdminContent();
}

export async function toggleFeaturedMovieAction(movieId: string, featured: boolean) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("movies")
    .update({
      featured,
      updated_by: userId,
    })
    .eq("id", movieId);

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: featured ? "content.featured" : "content.unfeatured",
    entityType: "movie",
    entityId: movieId,
  });
  revalidateAdminContent();
}

export async function duplicateMovieAction(movieId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { data: movie, error: fetchError } = await supabase
    .from("movies")
    .select("*")
    .eq("id", movieId)
    .single();

  if (fetchError || !movie) {
    redirect(`/admin/content?error=${encodeURIComponent(fetchError?.message ?? "Conteudo nao encontrado")}`);
  }

  const copyTitle = `${movie.title} Copy`;
  const { data: copy, error: insertError } = await supabase
    .from("movies")
    .insert({
      title: copyTitle,
      slug: `${movie.slug}-copy-${Date.now().toString(36)}`,
      description: movie.description,
      type: movie.type,
      poster_url: movie.poster_url,
      backdrop_url: movie.backdrop_url,
      trailer_url: movie.trailer_url,
      mux_playback_id: movie.mux_playback_id,
      release_year: movie.release_year,
      duration_minutes: movie.duration_minutes,
      maturity_rating: movie.maturity_rating,
      seo_title: movie.seo_title,
      seo_description: movie.seo_description,
      rating: movie.rating,
      sort_order: movie.sort_order ?? 0,
      is_original: movie.is_original ?? false,
      featured: false,
      status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (insertError) redirect(`/admin/content?error=${encodeURIComponent(insertError.message)}`);

  if (copy) {
    const { data: genres } = await supabase
      .from("movie_genres")
      .select("genre_id")
      .eq("movie_id", movieId);

    if (genres?.length) {
      await supabase.from("movie_genres").insert(
        genres.map((genre) => ({
          movie_id: copy.id,
          genre_id: genre.genre_id,
        })),
      );
    }

    await recordActivity({
      userId,
      action: "content.duplicated",
      entityType: "movie",
      entityId: copy.id,
      metadata: { source: movieId },
    });
  }

  revalidateAdminContent();
  redirect("/admin/content/movies");
}

export async function deleteMovieAction(movieId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/content/movies?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("movies").delete().eq("id", movieId);

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "content.deleted", entityType: "movie", entityId: movieId });
  revalidateAdminContent();
  redirect("/admin/content/movies");
}

export async function createCategoryAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/categories?demo=1");

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const { supabase, userId } = await assertAdmin();
  const { data, error } = await supabase
    .from("genres")
    .insert({
      name,
      slug: rawSlug ? slugify(rawSlug) : slugify(name),
      color: text(formData, "color") || "#13c8ff",
      icon: text(formData, "icon") || "film",
      active: formData.get("active") === "on",
      sort_order: intOrNull(text(formData, "sortOrder")) ?? 0,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "category.created",
    entityType: "genre",
    entityId: data?.id,
    metadata: { name },
  });
  revalidateEditorial();
  redirect("/admin/categories");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/categories?demo=1");

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("genres")
    .update({
      name,
      slug: rawSlug ? slugify(rawSlug) : slugify(name),
      color: text(formData, "color") || "#13c8ff",
      icon: text(formData, "icon") || "film",
      active: formData.get("active") === "on",
      sort_order: intOrNull(text(formData, "sortOrder")) ?? 0,
    })
    .eq("id", categoryId);

  if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "category.updated",
    entityType: "genre",
    entityId: categoryId,
    metadata: { name },
  });
  revalidateEditorial();
}

export async function deleteCategoryAction(categoryId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/categories?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("genres").delete().eq("id", categoryId);

  if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "category.deleted", entityType: "genre", entityId: categoryId });
  revalidateEditorial();
  redirect("/admin/categories");
}

export async function reorderCategoriesAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/categories?demo=1");

  const raw = text(formData, "order");
  if (!raw) redirect("/admin/categories");

  let ids: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    ids = [];
  }

  if (!ids.length) redirect("/admin/categories");

  const { supabase, userId } = await assertAdmin();

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const { error } = await supabase
      .from("genres")
      .update({ sort_order: i })
      .eq("id", id);
    if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  await recordActivity({
    userId,
    action: "category.reordered",
    entityType: "genre",
    metadata: { count: ids.length },
  });

  revalidateEditorial();
  redirect("/admin/categories");
}

function parseJsonStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

type CollectionItemDuplicateRow = {
  movie_id: string;
  position: number | null;
  note: string | null;
  pinned: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
};

export async function createCollectionAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const { supabase, userId } = await assertAdmin();

  const { data, error } = await supabase
    .from("collections")
    .insert({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      description: text(formData, "description") || "",
      short_description: text(formData, "shortDescription") || "",
      banner_url: text(formData, "bannerUrl") || null,
      cover_url: text(formData, "coverUrl") || null,
      accent_color: text(formData, "accentColor") || "#13c8ff",
      icon: text(formData, "icon") || "film",
      type: text(formData, "type") || "editorial",
      status: "draft",
      visibility: text(formData, "visibility") || "public",
      sort_order: intOrNull(text(formData, "sortOrder")) ?? 0,
      is_featured: formData.get("isFeatured") === "on",
      starts_at: text(formData, "startsAt") || null,
      ends_at: text(formData, "endsAt") || null,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "collection.created",
    entityType: "collection",
    entityId: data?.id,
    metadata: { title },
  });

  revalidateEditorial();
  redirect(data?.id ? `/admin/collections/${data.id}/edit` : "/admin/collections");
}

export async function updateCollectionAction(collectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const { supabase, userId } = await assertAdmin();

  const { error } = await supabase
    .from("collections")
    .update({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      description: text(formData, "description") || "",
      short_description: text(formData, "shortDescription") || "",
      banner_url: text(formData, "bannerUrl") || null,
      cover_url: text(formData, "coverUrl") || null,
      accent_color: text(formData, "accentColor") || "#13c8ff",
      icon: text(formData, "icon") || "film",
      type: text(formData, "type") || "editorial",
      visibility: text(formData, "visibility") || "public",
      sort_order: intOrNull(text(formData, "sortOrder")) ?? 0,
      is_featured: formData.get("isFeatured") === "on",
      starts_at: text(formData, "startsAt") || null,
      ends_at: text(formData, "endsAt") || null,
      updated_by: userId,
    })
    .eq("id", collectionId);

  if (error) redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "collection.updated",
    entityType: "collection",
    entityId: collectionId,
    metadata: { title },
  });

  revalidateEditorial();
  redirect(`/admin/collections/${collectionId}/edit`);
}

async function uploadCollectionAssetPatch(collectionId: string, assetField: "banner" | "cover", formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const { supabase, userId } = await assertAdmin();
  const folder = assetField === "banner" ? "collection-banners" : "collection-covers";
  let assetUrl: string | null = null;

  try {
    assetUrl = await uploadAsset(formData, assetField, folder);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar midia.";
    redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(message)}`);
  }

  const patch: Record<string, string | null> = {};
  if (assetField === "banner" && assetUrl) patch.banner_url = assetUrl;
  if (assetField === "cover" && assetUrl) patch.cover_url = assetUrl;

  if (!Object.keys(patch).length) {
    redirect(`/admin/collections/${collectionId}/edit`);
  }

  const { error } = await supabase
    .from("collections")
    .update({ ...patch, updated_by: userId })
    .eq("id", collectionId);

  if (error) redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "collection.assets_updated",
    entityType: "collection",
    entityId: collectionId,
    metadata: { [assetField]: Boolean(assetUrl) },
  });

  revalidateEditorial();
  redirect(`/admin/collections/${collectionId}/edit`);
}

export async function uploadCollectionAssetAction(collectionId: string, assetField: "banner" | "cover", formData: FormData) {
  return uploadCollectionAssetPatch(collectionId, assetField, formData);
}

export async function uploadCollectionAssetsAction(collectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const { supabase, userId } = await assertAdmin();
  let bannerUrl: string | null = null;
  let coverUrl: string | null = null;

  try {
    [bannerUrl, coverUrl] = await Promise.all([
      uploadAsset(formData, "banner", "collection-banners"),
      uploadAsset(formData, "cover", "collection-covers"),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar midia.";
    redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(message)}`);
  }

  const patch: Record<string, string | null> = {};
  if (bannerUrl) patch.banner_url = bannerUrl;
  if (coverUrl) patch.cover_url = coverUrl;

  if (!Object.keys(patch).length) {
    redirect(`/admin/collections/${collectionId}/edit`);
  }

  const { error } = await supabase
    .from("collections")
    .update({ ...patch, updated_by: userId })
    .eq("id", collectionId);

  if (error) redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "collection.assets_updated",
    entityType: "collection",
    entityId: collectionId,
    metadata: { banner: Boolean(bannerUrl), cover: Boolean(coverUrl) },
  });

  revalidateEditorial();
  redirect(`/admin/collections/${collectionId}/edit`);
}

export async function deleteCollectionAction(collectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);

  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "collection.deleted", entityType: "collection", entityId: collectionId });
  revalidateEditorial();
  redirect("/admin/collections");
}

export async function publishCollectionAction(collectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("collections").update({ status: "published", updated_by: userId }).eq("id", collectionId);
  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);
  await recordActivity({ userId, action: "collection.published", entityType: "collection", entityId: collectionId });
  revalidateEditorial();
}

export async function unpublishCollectionAction(collectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("collections").update({ status: "draft", updated_by: userId }).eq("id", collectionId);
  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);
  await recordActivity({ userId, action: "collection.unpublished", entityType: "collection", entityId: collectionId });
  revalidateEditorial();
}

export async function archiveCollectionAction(collectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("collections").update({ status: "archived", updated_by: userId }).eq("id", collectionId);
  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);
  await recordActivity({ userId, action: "collection.archived", entityType: "collection", entityId: collectionId });
  revalidateEditorial();
}

export async function duplicateCollectionAction(collectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { data: base, error: fetchError } = await supabase.from("collections").select("*").eq("id", collectionId).single();
  if (fetchError || !base) redirect(`/admin/collections?error=${encodeURIComponent(fetchError?.message ?? "Colecao nao encontrada")}`);

  const copyTitle = `${base.title} Copy`;
  const { data: copy, error: insertError } = await supabase
    .from("collections")
    .insert({
      title: copyTitle,
      slug: `${base.slug}-copy-${Date.now().toString(36)}`,
      description: base.description ?? "",
      short_description: base.short_description ?? "",
      banner_url: base.banner_url,
      cover_url: base.cover_url,
      accent_color: base.accent_color ?? "#13c8ff",
      icon: base.icon ?? "film",
      type: base.type ?? "editorial",
      status: "draft",
      visibility: base.visibility ?? "public",
      sort_order: base.sort_order ?? 0,
      is_featured: false,
      starts_at: base.starts_at,
      ends_at: base.ends_at,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (insertError) redirect(`/admin/collections?error=${encodeURIComponent(insertError.message)}`);

  const { data: baseItems } = await supabase.from("collection_items").select("*").eq("collection_id", collectionId).order("position", { ascending: true });
  if (copy && baseItems?.length) {
    await supabase.from("collection_items").insert(
      ((baseItems ?? []) as CollectionItemDuplicateRow[]).map((item) => ({
        collection_id: copy.id,
        movie_id: item.movie_id,
        position: item.position,
        note: item.note,
        pinned: item.pinned,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
      })),
    );
  }

  await recordActivity({ userId, action: "collection.duplicated", entityType: "collection", entityId: copy?.id, metadata: { source: collectionId } });
  revalidateEditorial();
  redirect(copy?.id ? `/admin/collections/${copy.id}/edit` : "/admin/collections");
}

export async function addCollectionItemAction(collectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect(`/admin/collections/${collectionId}/edit?demo=1`);

  const movieId = text(formData, "movieId");
  const position = intOrNull(text(formData, "position")) ?? 0;
  const { supabase, userId } = await assertAdmin();

  const { error } = await supabase.from("collection_items").insert({
    collection_id: collectionId,
    movie_id: movieId,
    position,
    note: text(formData, "note") || null,
    pinned: formData.get("pinned") === "on",
    starts_at: text(formData, "startsAt") || null,
    ends_at: text(formData, "endsAt") || null,
  });

  if (error) redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "collection.item_added", entityType: "collection", entityId: collectionId, metadata: { movieId } });
  revalidateEditorial();
  redirect(`/admin/collections/${collectionId}/edit`);
}

export async function removeCollectionItemAction(itemId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/collections?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { data: row } = await supabase.from("collection_items").select("collection_id").eq("id", itemId).single();
  const collectionId = (row as { collection_id?: string } | null)?.collection_id;

  const { error } = await supabase.from("collection_items").delete().eq("id", itemId);
  if (error) redirect(`/admin/collections?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "collection.item_removed", entityType: "collection_item", entityId: itemId });
  revalidateEditorial();
  redirect(collectionId ? `/admin/collections/${collectionId}/edit` : "/admin/collections");
}

export async function reorderCollectionItemsAction(collectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect(`/admin/collections/${collectionId}/edit?demo=1`);

  const raw = text(formData, "order");
  const ids = raw ? parseJsonStringArray(raw) : [];
  if (!ids.length) redirect(`/admin/collections/${collectionId}/edit`);

  const { supabase, userId } = await assertAdmin();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const { error } = await supabase.from("collection_items").update({ position: i }).eq("id", id);
    if (error) redirect(`/admin/collections/${collectionId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  await recordActivity({ userId, action: "collection.items_reordered", entityType: "collection", entityId: collectionId, metadata: { count: ids.length } });
  revalidateEditorial();
  redirect(`/admin/collections/${collectionId}/edit`);
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/users?demo=1");
  const nextPath = redirectTo(formData, "/admin/users");

  const role = text(formData, "role") || "user";
  const { supabase, userId: actorId } = await assertAdmin();

  const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId: actorId,
    action: "user.role_updated",
    entityType: "profile",
    entityId: undefined,
    metadata: { targetUserId: userId, role },
  });

  revalidateEditorial();
  redirect(nextPath);
}

export async function updateUserStatusAction(userId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/users?demo=1");
  const nextPath = redirectTo(formData, "/admin/users");

  const status = text(formData, "status") || "active";
  const { supabase, userId: actorId } = await assertAdmin();

  const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId: actorId,
    action: "user.status_updated",
    entityType: "profile",
    metadata: { targetUserId: userId, status },
  });

  revalidateEditorial();
  redirect(nextPath);
}

export async function blockUserAction(userId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/users?demo=1");
  const nextPath = redirectTo(formData, "/admin/users");

  const { supabase, userId: actorId } = await assertAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ blocked_at: new Date().toISOString(), blocked_reason: "blocked_by_admin" })
    .eq("user_id", userId);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId: actorId, action: "user.blocked", entityType: "profile", metadata: { targetUserId: userId } });
  revalidateEditorial();
  redirect(nextPath);
}

export async function unblockUserAction(userId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/users?demo=1");
  const nextPath = redirectTo(formData, "/admin/users");

  const { supabase, userId: actorId } = await assertAdmin();
  const { error } = await supabase.from("profiles").update({ blocked_at: null, blocked_reason: null, status: "active" }).eq("user_id", userId);

  if (error) redirect(`${nextPath}?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId: actorId, action: "user.unblocked", entityType: "profile", metadata: { targetUserId: userId } });
  revalidateEditorial();
  redirect(nextPath);
}

export async function createHomeSectionAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const sourceType = text(formData, "sourceType") || (text(formData, "type") === "collection" ? "collection" : "manual");
  const sourceId = text(formData, "sourceId") || null;
  const sourceKey = text(formData, "sourceKey") || null;
  const { supabase, userId } = await assertAdmin();
  const { data, error } = await supabase
    .from("home_sections")
    .insert({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      type: text(formData, "type") || "rail",
      position: intOrNull(text(formData, "position")) ?? 0,
      active: formData.get("active") === "on",
      source_type: sourceType,
      source_id: sourceType === "collection" ? sourceId : null,
      source_key: sourceType === "recommendation" || sourceType === "dynamic" ? sourceKey : null,
      layout_variant: text(formData, "layoutVariant") || null,
      display_limit: intOrNull(text(formData, "displayLimit")),
      show_collection_banner: formData.get("showCollectionBanner") === "on",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "home_section.created",
    entityType: "home_section",
    entityId: data?.id,
    metadata: { title },
  });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function updateHomeSectionAction(sectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const title = text(formData, "title");
  const rawSlug = text(formData, "slug");
  const sourceType = text(formData, "sourceType") || (text(formData, "type") === "collection" ? "collection" : "manual");
  const sourceId = text(formData, "sourceId") || null;
  const sourceKey = text(formData, "sourceKey") || null;
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("home_sections")
    .update({
      title,
      slug: rawSlug ? slugify(rawSlug) : slugify(title),
      type: text(formData, "type") || "rail",
      position: intOrNull(text(formData, "position")) ?? 0,
      active: formData.get("active") === "on",
      source_type: sourceType,
      source_id: sourceType === "collection" ? sourceId : null,
      source_key: sourceType === "recommendation" || sourceType === "dynamic" ? sourceKey : null,
      layout_variant: text(formData, "layoutVariant") || null,
      display_limit: intOrNull(text(formData, "displayLimit")),
      show_collection_banner: formData.get("showCollectionBanner") === "on",
      updated_by: userId,
    })
    .eq("id", sectionId);

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "home_section.updated",
    entityType: "home_section",
    entityId: sectionId,
    metadata: { title },
  });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function deleteHomeSectionAction(sectionId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("home_sections").delete().eq("id", sectionId);

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({ userId, action: "home_section.deleted", entityType: "home_section", entityId: sectionId });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function addHomeSectionItemAction(sectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const movieId = text(formData, "movieId");
  const position = intOrNull(text(formData, "position")) ?? 0;
  const { supabase, userId } = await assertAdmin();
  const { data, error } = await supabase
    .from("home_section_items")
    .upsert(
      {
        section_id: sectionId,
        movie_id: movieId,
        position,
      },
      { onConflict: "section_id,movie_id" },
    )
    .select("id")
    .single();

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "home_section_item.added",
    entityType: "home_section",
    entityId: sectionId,
    metadata: { movieId, itemId: data?.id ?? null },
  });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function updateHomeSectionItemAction(itemId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const position = intOrNull(text(formData, "position")) ?? 0;
  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase
    .from("home_section_items")
    .update({ position })
    .eq("id", itemId);

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "home_section_item.reordered",
    entityType: "home_section_item",
    entityId: itemId,
    metadata: { position },
  });
  revalidateEditorial();
}

export async function removeHomeSectionItemAction(itemId: string) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const { supabase, userId } = await assertAdmin();
  const { error } = await supabase.from("home_section_items").delete().eq("id", itemId);

  if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);

  await recordActivity({
    userId,
    action: "home_section_item.removed",
    entityType: "home_section_item",
    entityId: itemId,
  });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function reorderHomeSectionsAction(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const raw = text(formData, "order");
  const ids = raw ? parseJsonStringArray(raw) : [];
  if (!ids.length) redirect("/admin/home-editor");

  const { supabase, userId } = await assertAdmin();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const { error } = await supabase.from("home_sections").update({ position: i, updated_by: userId }).eq("id", id);
    if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);
  }

  await recordActivity({ userId, action: "home_section.reordered", entityType: "home_section", metadata: { count: ids.length } });
  revalidateEditorial();
  redirect("/admin/home-editor");
}

export async function reorderHomeSectionItemsAction(sectionId: string, formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/home-editor?demo=1");

  const raw = text(formData, "order");
  const ids = raw ? parseJsonStringArray(raw) : [];
  if (!ids.length) redirect("/admin/home-editor");

  const { supabase, userId } = await assertAdmin();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const { error } = await supabase.from("home_section_items").update({ position: i }).eq("id", id);
    if (error) redirect(`/admin/home-editor?error=${encodeURIComponent(error.message)}`);
  }

  await recordActivity({ userId, action: "home_section_item.reordered_bulk", entityType: "home_section", entityId: sectionId, metadata: { count: ids.length } });
  revalidateEditorial();
  redirect("/admin/home-editor");
}
