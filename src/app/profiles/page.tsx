import { ProfileSelectScreen } from "@/components/profiles/ProfileSelectScreen";
import { getViewerProfiles } from "@/services/profile/viewer-profile-service";

export default async function ProfilesPage() {
  const profiles = await getViewerProfiles();
  return <ProfileSelectScreen profiles={profiles} />;
}
