"use client";

import { useMemo, useState, useTransition } from "react";
import type { SettingsMap, SiteSetting } from "@/services/settings/settings-service";

export function useSettings(initialSettings: SettingsMap) {
  const [settings, setSettings] = useState(initialSettings);

  const updateLocalSetting = (key: string, value: unknown) => {
    setSettings((current) => ({
      ...current,
      [key]: {
        ...current[key],
        value,
      } as SiteSetting,
    }));
  };

  return { settings, setSettings, updateLocalSetting };
}

export function usePublicSettings(settings: SettingsMap) {
  return useMemo(() => Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.isPublic)), [settings]);
}

export function useThemeSettings(settings: SettingsMap) {
  return useMemo(() => Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.group === "theme")), [settings]);
}

export function useUpdateSettings() {
  const [isPending, startTransition] = useTransition();
  return { isPending, startTransition };
}

export function useLiveSettingsPreview(settings: SettingsMap) {
  return useMemo(() => {
    const value = <T,>(key: string, fallback: T) => {
      const raw = settings[key]?.value;
      return raw === undefined || raw === null || raw === "" ? fallback : (raw as T);
    };

    return {
      siteName: value("general.siteName", "MaxCinema"),
      slogan: value("general.slogan", "Cinema OS para uma nova era de streaming."),
      primaryColor: value("theme.primaryColor", "#13c8ff"),
      secondaryColor: value("theme.secondaryColor", "#ff9f43"),
      backgroundColor: value("theme.backgroundColor", "#030609"),
      cardColor: value("theme.cardColor", "#08131d"),
      textColor: value("theme.textColor", "#f6fbff"),
      mutedTextColor: value("theme.mutedTextColor", "#92a7b7"),
      logoUrl: value("identity.logoUrl", ""),
    };
  }, [settings]);
}

export function useSystemStatus(settings: SettingsMap) {
  return useMemo(() => {
    const status = String(settings["general.platformStatus"]?.value ?? "online");
    const maintenance = Boolean(settings["maintenance.enabled"]?.value);
    return {
      status: maintenance ? "maintenance" : status,
      isOnline: status === "online" && !maintenance,
      isMaintenance: maintenance || status === "maintenance",
    };
  }, [settings]);
}
