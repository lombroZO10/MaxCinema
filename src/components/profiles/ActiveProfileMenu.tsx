import type { ViewerProfile } from "@/types/domain";
import { KidsModeBadge } from "@/components/profiles/KidsModeBadge";

export function ActiveProfileMenu({ profile }: { profile: ViewerProfile | null }) {
  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <img alt="" className="size-8 rounded-full object-cover ring-1 ring-white/12" src={profile.avatarUrl} />
      <span className="text-sm font-semibold text-white">{profile.name}</span>
      {profile.profileType === "kids" ? <KidsModeBadge /> : null}
    </div>
  );
}
