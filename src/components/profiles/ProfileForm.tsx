import Link from "next/link";
import type { ViewerProfile } from "@/types/domain";
import { createViewerProfileAction, updateViewerProfileAction } from "@/app/profiles/actions";
import { MaturitySelector } from "@/components/profiles/MaturitySelector";
import { ProfileAvatarPicker } from "@/components/profiles/ProfileAvatarPicker";
import { ProfileThemePicker } from "@/components/profiles/ProfileThemePicker";
import { profileAvatars, profileThemeColors } from "@/services/profile/viewer-profile-service";

export function ProfileForm({ profile }: { profile?: ViewerProfile }) {
  const action = profile ? updateViewerProfileAction : createViewerProfileAction;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {profile ? <input name="profileId" type="hidden" value={profile.id} /> : null}
      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur-xl md:p-7">
        <div>
          <label className="text-sm font-semibold text-white">Nome do perfil</label>
          <input
            className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/[0.055] px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
            defaultValue={profile?.name}
            maxLength={28}
            name="name"
            placeholder="Ex: Joao, Familia, Kids"
            required
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Avatar</p>
          <div className="mt-3">
            <ProfileAvatarPicker defaultAvatar={profile?.avatarUrl || profileAvatars[0]} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-white">Tipo de perfil</label>
            <select
              className="mt-2 h-12 w-full rounded-md border border-white/12 bg-[#080d12] px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
              defaultValue={profile?.profileType || "adult"}
              name="profileType"
            >
              <option value="adult">Adulto</option>
              <option value="kids">Infantil</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white">Idioma preferido</label>
            <select
              className="mt-2 h-12 w-full rounded-md border border-white/12 bg-[#080d12] px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
              defaultValue={profile?.language || "pt-BR"}
              name="language"
            >
              <option value="pt-BR">Portugues Brasil</option>
              <option value="en-US">English</option>
              <option value="es-ES">Espanol</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-white">Classificacao maxima</label>
            <MaturitySelector defaultValue={profile?.maturityLimit || "18"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Tema do perfil</p>
            <div className="mt-3">
              <ProfileThemePicker defaultColor={profile?.themeColor || profileThemeColors[0]} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/22 p-4 text-sm font-semibold text-white/78">
            Autoplay
            <input className="size-5 accent-cinema-cyan" defaultChecked={profile?.autoplayEnabled ?? true} name="autoplayEnabled" type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/22 p-4 text-sm font-semibold text-white/78">
            Trailer autoplay
            <input className="size-5 accent-cinema-cyan" defaultChecked={profile?.trailerAutoplayEnabled ?? true} name="trailerAutoplayEnabled" type="checkbox" />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button className="rounded-md bg-cinema-cyan px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#65ddff]" type="submit">
            {profile ? "Salvar perfil" : "Criar perfil"}
          </button>
          <Link className="rounded-md border border-white/12 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white" href="/profiles">
            Cancelar
          </Link>
        </div>
      </div>

      <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cinema-cyan">Preview</p>
        <div className="mt-6 text-center">
          <img alt="" className="mx-auto aspect-square w-44 rounded-[1.5rem] object-cover ring-1 ring-white/14" src={profile?.avatarUrl || profileAvatars[0]} />
          <h2 className="mt-5 text-2xl font-semibold text-white">{profile?.name || "Novo perfil"}</h2>
          <p className="mt-2 text-sm text-white/48">Universo de exibicao separado para favoritos, progresso e recomendacoes.</p>
        </div>
      </aside>
    </form>
  );
}
