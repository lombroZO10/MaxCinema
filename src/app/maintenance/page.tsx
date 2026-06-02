import Link from "next/link";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";

export default async function MaintenancePage() {
  const settings = await getPublicSettings();
  const siteName = getSettingValue(settings, "general.siteName", "MaxCinema");
  const message = getSettingValue(settings, "maintenance.message", "Estamos atualizando o MaxCinema.");
  const supportEmail = getSettingValue(settings, "general.supportEmail", "suporte@maxcinema.local");

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">
      <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.045] p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,.42)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase text-cinema-cyan">{siteName}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Plataforma em manutencao</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-cinema-muted">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="inline-flex h-11 items-center justify-center rounded-md bg-cinema-cyan px-5 text-sm font-semibold text-slate-950" href="/login">
            Acessar admin
          </Link>
          <a className="inline-flex h-11 items-center justify-center rounded-md border border-white/12 bg-white/[0.055] px-5 text-sm font-semibold text-white/72" href={`mailto:${supportEmail}`}>
            Suporte
          </a>
        </div>
      </section>
    </main>
  );
}
