import { Edit, Plus } from "lucide-react";
import Link from "next/link";
import type { ViewerProfile } from "@/types/domain";
import { DeleteProfileDialog } from "@/components/profiles/DeleteProfileDialog";
import { KidsModeBadge } from "@/components/profiles/KidsModeBadge";

export function ManageProfilesGrid({ profiles }: { profiles: ViewerProfile[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {profiles.map((profile) => (
        <article className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_90px_rgba(0,0,0,.34)] transition hover:-translate-y-1 hover:border-white/22" key={profile.id}>
          <div className="relative">
            <img alt="" className="aspect-square w-full rounded-[1.25rem] object-cover" src={profile.avatarUrl} />
            {profile.profileType === "kids" ? (
              <span className="absolute right-3 top-3">
                <KidsModeBadge />
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{profile.name}</h2>
              <p className="mt-1 text-xs text-white/42">{profile.language} - ate {profile.maturityLimit}</p>
            </div>
            <span className="size-3 rounded-full" style={{ backgroundColor: profile.themeColor }} />
          </div>
          <div className="mt-5 flex gap-2">
            <Link className="flex flex-1 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href={`/profiles/${profile.id}/edit`}>
              <Edit size={15} />
              Editar
            </Link>
            <DeleteProfileDialog profile={profile} />
          </div>
        </article>
      ))}
      <Link className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-white/14 bg-white/[0.025] p-6 text-center text-white/58 transition hover:border-cinema-cyan/40 hover:bg-cinema-cyan/8 hover:text-white" href="/profiles/new">
        <span>
          <Plus className="mx-auto mb-4" size={28} />
          <span className="font-semibold">Adicionar perfil</span>
        </span>
      </Link>
    </div>
  );
}
