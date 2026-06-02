import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getPublicSettings, getSettingValue } from "@/services/settings/settings-service";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = getSettingValue(settings, "general.siteName", "MaxCinema");
  const title = getSettingValue(settings, "seo.title", "MaxCinema | Cinema OS 2026");
  const description = getSettingValue(settings, "seo.description", "Plataforma premium de streaming com interface Cinema OS 2026, preparada para Supabase, Mux e assinaturas.");
  const keywords = getSettingValue(settings, "seo.keywords", "MaxCinema, streaming, filmes, series, Cinema OS 2026")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const ogTitle = getSettingValue(settings, "seo.ogTitle", siteName);
  const ogDescription = getSettingValue(settings, "seo.ogDescription", description);
  const ogImage = getSettingValue(settings, "identity.shareImageUrl", "");
  const canonical = getSettingValue(settings, "seo.canonicalUrl", "");
  const robots = getSettingValue(settings, "seo.robots", "index,follow");
  const twitterCard = getSettingValue(settings, "seo.twitterCard", "summary_large_image") as "summary" | "summary_large_image";

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings();
  const themeStyle = {
    "--background": getSettingValue(settings, "theme.backgroundColor", "#030609"),
    "--foreground": getSettingValue(settings, "theme.textColor", "#f6fbff"),
    "--cyan": getSettingValue(settings, "theme.primaryColor", "#13c8ff"),
    "--amber": getSettingValue(settings, "theme.secondaryColor", "#ff9f43"),
    "--magenta": getSettingValue(settings, "theme.accentColor", "#e04cff"),
    "--muted": getSettingValue(settings, "theme.mutedTextColor", "#92a7b7"),
  } as CSSProperties;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeStyle}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
