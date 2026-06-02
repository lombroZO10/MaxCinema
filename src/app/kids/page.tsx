import { redirect } from "next/navigation";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";

export default async function KidsPage() {
  const profile = await getActiveViewerProfile();
  if (!profile || profile.profileType !== "kids") {
    redirect("/browse");
  }

  redirect("/browse?mode=kids");
}
