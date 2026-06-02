"use client";

import { motion } from "framer-motion";
import type { ViewerProfile } from "@/types/domain";
import { KidsModeBadge } from "@/components/profiles/KidsModeBadge";

export function ProfileCard({
  profile,
  action,
}: {
  profile: ViewerProfile;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <motion.form
      action={action}
      className="group relative text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36 }}
    >
      <input name="profileId" type="hidden" value={profile.id} />
      <button
        className="relative block outline-none"
        type="submit"
      >
        <span
          className="absolute -inset-2 rounded-[2rem] opacity-0 blur-xl transition duration-500 group-hover:opacity-45 group-focus-within:opacity-45"
          style={{ backgroundColor: profile.themeColor }}
        />
        <span className="relative block overflow-hidden rounded-[1.65rem] border border-white/12 bg-white/[0.045] p-3 shadow-[0_24px_90px_rgba(0,0,0,.38)] transition duration-500 group-hover:-translate-y-2 group-hover:border-white/24 group-hover:bg-white/[0.075] group-focus-within:ring-2 group-focus-within:ring-cinema-cyan/50">
          <img alt="" className="aspect-square w-40 rounded-[1.25rem] object-cover md:w-44 xl:w-48" src={profile.avatarUrl} />
          {profile.profileType === "kids" ? (
            <span className="absolute right-5 top-5">
              <KidsModeBadge />
            </span>
          ) : null}
        </span>
        <span className="mt-4 block text-lg font-semibold text-white">{profile.name}</span>
        {profile.lastUsedAt ? <span className="mt-1 block text-xs text-white/42">Usado recentemente</span> : null}
      </button>
    </motion.form>
  );
}
