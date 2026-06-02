import { HomeEditorStudio } from "@/components/admin/home-editor/HomeEditorStudio";
import { getAdminHomeSections } from "@/services/admin-service";
import { getCatalogMovies } from "@/services/catalog-service";
import { getCollections } from "@/services/collections/collection-service";
import { getSettingValue, getSettings } from "@/services/settings/settings-service";

export default async function AdminHomeEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, movies, sections, collections, settings] = await Promise.all([
    searchParams,
    getCatalogMovies({ includeDrafts: true }),
    getAdminHomeSections(),
    getCollections({ includeDrafts: true }),
    getSettings(),
  ]);

  return (
    <HomeEditorStudio
      collections={collections}
      error={error}
      movies={movies}
      preferences={{
        siteName: getSettingValue(settings, "general.siteName", "MaxCinema"),
        cardsPerSection: getSettingValue(settings, "browse.cardsPerSection", 12),
        showCollections: getSettingValue(settings, "browse.showCollections", true),
        showOriginals: getSettingValue(settings, "browse.showOriginals", true),
        showRecommendations: getSettingValue(settings, "browse.showRecommendations", true),
        showContinueWatching: getSettingValue(settings, "browse.showContinueWatching", true),
        heroRotating: getSettingValue(settings, "browse.heroRotating", true),
        heroRotationMs: getSettingValue(settings, "browse.heroRotationMs", 8500),
        posterFallbackUrl: getSettingValue(settings, "identity.posterFallbackUrl", ""),
        backdropFallbackUrl: getSettingValue(settings, "identity.backdropFallbackUrl", ""),
      }}
      sections={sections}
    />
  );
}
