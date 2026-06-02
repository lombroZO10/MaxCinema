"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Brush,
  Database,
  Download,
  Eye,
  Film,
  Gauge,
  Globe,
  HardDrive,
  Lock,
  MonitorPlay,
  Palette,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resetSystemSettingsAction, resetSystemSettingsSectionAction, updateSystemSettingsAction, uploadSystemAssetAction } from "@/app/admin/actions";
import type { SettingGroup, SettingsMap, SiteSetting } from "@/services/settings/settings-service";
import { useLiveSettingsPreview, useSettings, useSystemStatus, useUpdateSettings } from "@/hooks/use-settings";
import { cn } from "@/utils/cn";

const GROUP_ORDER: SettingGroup[] = [
  "general",
  "identity",
  "theme",
  "seo",
  "player",
  "browse",
  "admin",
  "media",
  "integrations",
  "security",
  "maintenance",
  "footer",
  "advanced",
];

const GROUP_LABELS: Record<SettingGroup, string> = {
  general: "Geral",
  identity: "Identidade visual",
  theme: "Tema e cores",
  seo: "SEO",
  player: "Player",
  browse: "Browse",
  admin: "Admin Studio",
  media: "Uploads e midia",
  integrations: "Integracoes",
  security: "Seguranca",
  maintenance: "Manutencao",
  footer: "Rodape",
  advanced: "Avancado",
};

const GROUP_ICONS: Record<SettingGroup, typeof Settings> = {
  general: Globe,
  identity: Sparkles,
  theme: Palette,
  seo: Search,
  player: MonitorPlay,
  browse: Film,
  admin: Gauge,
  media: UploadCloud,
  integrations: Database,
  security: Shield,
  maintenance: AlertTriangle,
  footer: BadgeCheck,
  advanced: HardDrive,
};

const SELECT_OPTIONS: Record<string, string[]> = {
  "general.language": ["pt-BR", "en-US", "es"],
  "general.timezone": ["America/Sao_Paulo", "UTC", "America/New_York", "Europe/Lisbon"],
  "general.platformStatus": ["online", "maintenance", "private", "admins_only"],
  "seo.robots": ["index,follow", "noindex,nofollow", "index,nofollow"],
  "seo.twitterCard": ["summary_large_image", "summary"],
  "player.provider": ["local", "hls", "mux", "external"],
  "admin.defaultListLayout": ["table", "grid", "editorial", "compact"],
};

const UPLOAD_SETTING_KEYS = new Set([
  "identity.logoUrl",
  "identity.compactLogoUrl",
  "identity.adminLogoUrl",
  "identity.faviconUrl",
  "identity.pwaIconUrl",
  "identity.shareImageUrl",
  "identity.heroFallbackUrl",
  "identity.posterFallbackUrl",
  "identity.backdropFallbackUrl",
  "identity.avatarFallbackUrl",
]);

const THEME_PRESETS = [
  {
    label: "MaxCinema Classic",
    values: {
      "theme.primaryColor": "#13c8ff",
      "theme.secondaryColor": "#ff9f43",
      "theme.accentColor": "#e04cff",
      "theme.backgroundColor": "#030609",
      "theme.cardColor": "#08131d",
      "theme.textColor": "#f6fbff",
      "theme.mutedTextColor": "#92a7b7",
    },
  },
  {
    label: "Cinema Dark",
    values: {
      "theme.primaryColor": "#35d6a6",
      "theme.secondaryColor": "#f2c14e",
      "theme.accentColor": "#f97068",
      "theme.backgroundColor": "#050505",
      "theme.cardColor": "#151515",
      "theme.textColor": "#f7f3ea",
      "theme.mutedTextColor": "#a8a39a",
    },
  },
  {
    label: "Midnight Premium",
    values: {
      "theme.primaryColor": "#6ee7f9",
      "theme.secondaryColor": "#f6d365",
      "theme.accentColor": "#fb7185",
      "theme.backgroundColor": "#071019",
      "theme.cardColor": "#0d1b2a",
      "theme.textColor": "#f8fbff",
      "theme.mutedTextColor": "#9fb4c7",
    },
  },
  {
    label: "Soft Editorial",
    values: {
      "theme.primaryColor": "#277da1",
      "theme.secondaryColor": "#f9c74f",
      "theme.accentColor": "#43aa8b",
      "theme.backgroundColor": "#111517",
      "theme.cardColor": "#1d2426",
      "theme.textColor": "#f7f4ed",
      "theme.mutedTextColor": "#b7aca0",
    },
  },
  {
    label: "OLED Black",
    values: {
      "theme.primaryColor": "#00f5d4",
      "theme.secondaryColor": "#fee440",
      "theme.accentColor": "#ff006e",
      "theme.backgroundColor": "#000000",
      "theme.cardColor": "#090909",
      "theme.textColor": "#ffffff",
      "theme.mutedTextColor": "#a7a7a7",
    },
  },
  {
    label: "Blue Accent",
    values: {
      "theme.primaryColor": "#38bdf8",
      "theme.secondaryColor": "#22c55e",
      "theme.accentColor": "#f59e0b",
      "theme.backgroundColor": "#06131f",
      "theme.cardColor": "#0f2235",
      "theme.textColor": "#f5fbff",
      "theme.mutedTextColor": "#a6c1d5",
    },
  },
  {
    label: "Red Carpet",
    values: {
      "theme.primaryColor": "#ef233c",
      "theme.secondaryColor": "#f6c453",
      "theme.accentColor": "#2ec4b6",
      "theme.backgroundColor": "#090607",
      "theme.cardColor": "#1a0d10",
      "theme.textColor": "#fff5f5",
      "theme.mutedTextColor": "#c5a4a4",
    },
  },
  {
    label: "Minimal Studio",
    values: {
      "theme.primaryColor": "#d8dee9",
      "theme.secondaryColor": "#88c0d0",
      "theme.accentColor": "#a3be8c",
      "theme.backgroundColor": "#101317",
      "theme.cardColor": "#1a1f24",
      "theme.textColor": "#f2f4f8",
      "theme.mutedTextColor": "#9aa5b1",
    },
  },
];

function settingValue(setting?: SiteSetting) {
  return setting?.value ?? "";
}

function fieldValue(setting?: SiteSetting) {
  const value = settingValue(setting);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : JSON.stringify(value);
}

function normalizeValue(setting: SiteSetting, raw: string | boolean) {
  if (setting.type === "boolean") return Boolean(raw);
  if (setting.type === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (setting.type === "json") {
    try {
      return JSON.parse(String(raw));
    } catch {
      return raw;
    }
  }
  return raw;
}

function contrastWarning(settings: SettingsMap) {
  return getContrastRatio(
    String(settings["theme.backgroundColor"]?.value ?? "#030609"),
    String(settings["theme.textColor"]?.value ?? "#f6fbff"),
  ) < 4.5;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const value = Number.parseInt(clean, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getContrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function SettingsPanel({
  settings: initialSettings,
  saved,
  error,
  demo,
}: {
  settings: SettingsMap;
  saved?: string;
  error?: string;
  demo?: boolean;
}) {
  const [activeGroup, setActiveGroup] = useState<SettingGroup>("general");
  const { settings, updateLocalSetting } = useSettings(initialSettings);
  const { isPending, startTransition } = useUpdateSettings();
  const preview = useLiveSettingsPreview(settings);
  const systemStatus = useSystemStatus(settings);
  const [baseline, setBaseline] = useState(() => JSON.stringify(Object.fromEntries(Object.entries(initialSettings).map(([key, setting]) => [key, setting.value]))));

  const valuesJson = useMemo(() => JSON.stringify(Object.fromEntries(Object.entries(settings).map(([key, setting]) => [key, setting.value]))), [settings]);
  const hasChanges = valuesJson !== baseline;
  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      settings: Object.values(settings).filter((setting) => setting.group === group),
    }));
  }, [settings]);
  const activeSettings = grouped.find((item) => item.group === activeGroup)?.settings ?? [];
  const hasBadContrast = contrastWarning(settings);
  const seoTitle = String(settings["seo.title"]?.value ?? "MaxCinema | Cinema OS 2026");
  const seoDescription = String(settings["seo.description"]?.value ?? "");
  const shareImage = String(settings["identity.shareImageUrl"]?.value ?? "");

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges]);

  const setValue = (key: string, raw: string | boolean) => {
    const setting = settings[key];
    if (!setting) return;
    updateLocalSetting(key, normalizeValue(setting, raw));
  };

  const applyPreset = (values: Record<string, string>) => {
    for (const [key, value] of Object.entries(values)) {
      updateLocalSetting(key, value);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(JSON.parse(valuesJson), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "maxcinema-settings.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(parsed)) {
        if (settings[key]) updateLocalSetting(key, value);
      }
    } catch {
      window.alert("JSON invalido para importacao.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_390px]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase text-white/42">MaxCinema</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Control Panel</h1>
          <p className="mt-2 text-sm leading-6 text-white/48">Configuracao global da plataforma, com preview e salvamento em lote.</p>
          <div className="mt-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/58">
            <span className={cn("size-2 rounded-full", systemStatus.isOnline ? "bg-emerald-300" : "bg-amber-300")} />
            {systemStatus.status}
          </div>
        </section>

        <nav className="rounded-lg border border-white/10 bg-white/[0.035] p-2 backdrop-blur-xl">
          {GROUP_ORDER.map((group) => {
            const Icon = GROUP_ICONS[group];
            const count = grouped.find((item) => item.group === group)?.settings.length ?? 0;
            return (
              <button
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-white/58 transition hover:bg-white/[0.055] hover:text-white",
                  activeGroup === group && "bg-cinema-cyan text-slate-950 hover:bg-cinema-cyan hover:text-slate-950",
                )}
                key={group}
                onClick={() => setActiveGroup(group)}
                type="button"
              >
                <Icon size={16} />
                <span className="min-w-0 flex-1 truncate">{GROUP_LABELS[group]}</span>
                <span className="text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="space-y-5">
        <header className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-cinema-cyan">Sistema</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{GROUP_LABELS[activeGroup]}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/48">Edite os valores, acompanhe o preview e salve tudo de uma vez.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={resetSystemSettingsSectionAction}>
                <input name="group" type="hidden" value={activeGroup} />
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-white/70 hover:text-white"
                  onClick={(event) => {
                    if (!window.confirm("Resetar esta secao para o padrao?")) event.preventDefault();
                  }}
                  type="submit"
                >
                  <RotateCcw size={14} />
                  Reset secao
                </button>
              </form>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-white/70 hover:text-white" onClick={exportJson} type="button">
                <Download size={14} />
                Exportar JSON
              </button>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-white/70 hover:text-white">
                <UploadCloud size={14} />
                Importar JSON
                <input accept="application/json" className="hidden" onChange={(event) => void importJson(event.target.files?.[0] ?? null)} type="file" />
              </label>
            </div>
          </div>

          {saved ? (
            <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Configuracoes salvas.
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}
          {demo ? (
            <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Supabase nao configurado. O painel esta em modo demonstracao.
            </div>
          ) : null}
          {hasBadContrast ? (
            <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Contraste ruim detectado: fundo e texto principal estao iguais.
            </div>
          ) : null}
        </header>

        {activeGroup === "theme" ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-white">
              <Brush size={18} />
              <h3 className="text-lg font-semibold">Presets visuais</h3>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {THEME_PRESETS.map((preset) => (
                <button className="rounded-md border border-white/10 bg-black/18 p-3 text-left hover:border-cinema-cyan/45" key={preset.label} onClick={() => applyPreset(preset.values)} type="button">
                  <span className="text-sm font-semibold text-white">{preset.label}</span>
                  <span className="mt-3 flex gap-1">
                    {Object.values(preset.values).slice(0, 5).map((color) => (
                      <span className="size-5 rounded-full border border-white/10" key={color} style={{ backgroundColor: color }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeGroup === "seo" ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <SeoPreviewCard description={seoDescription} label="Google" title={seoTitle} />
            <SeoPreviewCard description={seoDescription} image={shareImage} label="WhatsApp" title={seoTitle} />
            <SeoPreviewCard description={seoDescription} image={shareImage} label="Discord / X" title={seoTitle} />
          </section>
        ) : null}

        <form action={updateSystemSettingsAction} className="hidden" id="system-settings-save-form" onSubmit={() => startTransition(() => setBaseline(valuesJson))}>
          <input name="settingsJson" readOnly type="hidden" value={valuesJson} />
          <input name="redirectTo" readOnly type="hidden" value="/admin/settings" />
        </form>

        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-2">
            {activeSettings.map((setting) => (
              <SettingField key={setting.key} onChange={setValue} setting={setting} />
            ))}
          </section>

          <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#07111a]/95 p-3 shadow-[0_18px_70px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm">
              <span className={cn("size-2 rounded-full", hasChanges ? "bg-amber-300" : "bg-emerald-300")} />
              <span className="text-white/60">{hasChanges ? "Alteracoes pendentes" : "Tudo sincronizado"}</span>
            </div>
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-cinema-cyan px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={!hasChanges || isPending} form="system-settings-save-form" type="submit">
              <Save size={16} />
              {isPending ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </div>

        <form action={resetSystemSettingsAction}>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300/20 bg-red-500/10 px-3 text-xs font-semibold text-red-100 hover:bg-red-500/15"
            onClick={(event) => {
              if (!window.confirm("Resetar todas as configuracoes para o padrao?")) event.preventDefault();
            }}
            type="submit"
          >
            <Lock size={14} />
            Reset geral
          </button>
        </form>
      </main>

      <aside className="xl:sticky xl:top-24 xl:h-fit">
        <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-white/42">Preview ao vivo</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Experiencia publica</h3>
            </div>
            <Eye className="text-cinema-cyan" size={20} />
          </div>

          <div
            className="mt-5 overflow-hidden rounded-lg border border-white/10 p-4"
            style={{
              background: `linear-gradient(160deg, ${preview.backgroundColor}, ${preview.cardColor})`,
              color: preview.textColor,
            }}
          >
            <div className="flex items-center gap-3">
              {preview.logoUrl ? <img alt="" className="size-10 rounded-md object-contain" src={preview.logoUrl} /> : <div className="grid size-10 place-items-center rounded-md" style={{ backgroundColor: preview.primaryColor, color: "#07111a" }}>M</div>}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{preview.siteName}</p>
                <p className="truncate text-xs" style={{ color: preview.mutedTextColor }}>{preview.slogan}</p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-white/10 p-4" style={{ backgroundColor: preview.cardColor }}>
              <div className="mb-3 h-24 rounded-md" style={{ background: `linear-gradient(135deg, ${preview.primaryColor}44, ${preview.secondaryColor}33)` }} />
              <p className="text-sm font-semibold">Mini hero</p>
              <p className="mt-1 text-xs leading-5" style={{ color: preview.mutedTextColor }}>Preview de banner, card, badge, input e botao principal.</p>
              <button className="mt-4 h-10 rounded-md px-4 text-sm font-semibold" style={{ backgroundColor: preview.primaryColor, color: "#06101a" }} type="button">
                Botao primario
              </button>
            </div>

            <div className="mt-4 grid grid-cols-[72px_1fr] gap-3">
              <div className="aspect-[2/3] rounded-md" style={{ background: `linear-gradient(180deg, ${preview.secondaryColor}66, ${preview.cardColor})` }} />
              <div>
                <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${preview.primaryColor}22`, color: preview.primaryColor }}>Badge</span>
                <input className="mt-3 h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none" placeholder="Input de busca" />
                <div className="mt-3 rounded-md border border-white/10 bg-black/18 p-3 text-xs" style={{ color: preview.mutedTextColor }}>Admin card</div>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function SettingField({
  setting,
  onChange,
}: {
  setting: SiteSetting;
  onChange: (key: string, value: string | boolean) => void;
}) {
  const value = fieldValue(setting);
  const commonLabel = (
    <div>
      <span className="text-xs font-semibold uppercase text-white/58">{setting.label}</span>
      <p className="mt-1 text-xs leading-5 text-white/38">{setting.description}</p>
    </div>
  );

  if (setting.type === "boolean") {
    return (
      <label className="flex min-h-28 items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        {commonLabel}
        <input className="size-5 accent-cinema-cyan" checked={Boolean(setting.value)} onChange={(event) => onChange(setting.key, event.target.checked)} type="checkbox" />
      </label>
    );
  }

  if (setting.type === "select") {
    return (
      <label className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        {commonLabel}
        <select className="mt-3 h-11 w-full rounded-md border border-white/10 bg-[#07111a] px-3 text-sm text-white outline-none" onChange={(event) => onChange(setting.key, event.target.value)} value={String(value)}>
          {(SELECT_OPTIONS[setting.key] ?? [String(value)]).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      {commonLabel}
      <div className="mt-3 flex gap-2">
        {setting.type === "color" ? <input className="h-11 w-14 rounded-md border border-white/10 bg-black/20 p-1" onChange={(event) => onChange(setting.key, event.target.value)} type="color" value={String(value)} /> : null}
        <input
          className="h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-black/22 px-3 text-sm text-white outline-none focus:border-cinema-cyan/60"
          onChange={(event) => onChange(setting.key, event.target.value)}
          type={setting.type === "number" ? "number" : setting.type === "url" ? "url" : "text"}
          value={String(value)}
        />
      </div>
      {UPLOAD_SETTING_KEYS.has(setting.key) ? (
        <form action={uploadSystemAssetAction.bind(null, setting.key, `asset_${setting.key}`)} className="mt-3 flex items-center gap-2">
          <input accept="image/*" className="min-w-0 flex-1 text-xs text-white/54 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white/75" name={`asset_${setting.key}`} type="file" />
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-white/70 hover:text-white" type="submit">
            <UploadCloud size={13} />
            Upload
          </button>
        </form>
      ) : null}
    </label>
  );
}

function SeoPreviewCard({
  label,
  title,
  description,
  image,
}: {
  label: string;
  title: string;
  description: string;
  image?: string;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
      {image ? <img alt="" className="aspect-[1.91/1] w-full object-cover" src={image} /> : null}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase text-cinema-cyan">{label}</p>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/48">{description || "Descricao ainda nao configurada."}</p>
      </div>
    </article>
  );
}
