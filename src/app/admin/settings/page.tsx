import { SettingsPanel } from "@/components/admin/settings/SettingsPanel";
import { getSettings } from "@/services/settings/settings-service";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; demo?: string }>;
}) {
  const [settings, params] = await Promise.all([getSettings(), searchParams]);
  return <SettingsPanel demo={params.demo === "1"} error={params.error} saved={params.saved} settings={settings} />;
}
