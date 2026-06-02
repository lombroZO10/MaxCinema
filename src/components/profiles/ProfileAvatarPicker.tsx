import { profileAvatars } from "@/services/profile/viewer-profile-service";

export function ProfileAvatarPicker({ defaultAvatar }: { defaultAvatar?: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {profileAvatars.map((avatar, index) => (
        <label className="group cursor-pointer" key={avatar}>
          <input
            className="peer sr-only"
            defaultChecked={(defaultAvatar || profileAvatars[0]) === avatar}
            name="avatarUrl"
            type="radio"
            value={avatar}
          />
          <span className="block rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 transition peer-checked:border-cinema-cyan peer-checked:bg-cinema-cyan/10 group-hover:border-white/24">
            <img alt="" className="aspect-square w-full rounded-xl object-cover" src={avatar} />
          </span>
          <span className="mt-2 block text-center text-xs text-white/38">Avatar {index + 1}</span>
        </label>
      ))}
    </div>
  );
}
