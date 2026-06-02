import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingGroup =
  | "general"
  | "identity"
  | "theme"
  | "seo"
  | "player"
  | "browse"
  | "admin"
  | "media"
  | "integrations"
  | "security"
  | "maintenance"
  | "footer"
  | "advanced";

export type SettingType = "string" | "number" | "boolean" | "color" | "url" | "select" | "json";

export type SiteSetting<T = unknown> = {
  id?: string;
  key: string;
  value: T;
  group: SettingGroup;
  type: SettingType;
  label: string;
  description: string;
  isPublic: boolean;
  updatedAt?: string;
};

export type SettingsMap = Record<string, SiteSetting>;

type SettingRow = {
  id?: string;
  key: string;
  value: unknown;
  group: SettingGroup | null;
  type: SettingType | null;
  label: string | null;
  description: string | null;
  is_public: boolean | null;
  updated_at?: string | null;
};

export const DEFAULT_SETTINGS: SettingsMap = {
  "general.siteName": {
    key: "general.siteName",
    value: "MaxCinema",
    group: "general",
    type: "string",
    label: "Nome do site",
    description: "Nome publico usado no Browse, SEO e Admin.",
    isPublic: true,
  },
  "general.slogan": {
    key: "general.slogan",
    value: "Cinema OS para uma nova era de streaming.",
    group: "general",
    type: "string",
    label: "Slogan",
    description: "Frase curta para hero, previews e compartilhamentos.",
    isPublic: true,
  },
  "general.shortDescription": {
    key: "general.shortDescription",
    value: "Plataforma premium de streaming com catalogo, perfis e curadoria editorial.",
    group: "general",
    type: "string",
    label: "Descricao curta",
    description: "Resumo institucional do produto.",
    isPublic: true,
  },
  "general.language": {
    key: "general.language",
    value: "pt-BR",
    group: "general",
    type: "select",
    label: "Idioma padrao",
    description: "Idioma base da plataforma.",
    isPublic: true,
  },
  "general.timezone": {
    key: "general.timezone",
    value: "America/Sao_Paulo",
    group: "general",
    type: "select",
    label: "Fuso horario",
    description: "Fuso usado por agendamentos editoriais.",
    isPublic: false,
  },
  "general.publicUrl": {
    key: "general.publicUrl",
    value: "http://localhost:3000",
    group: "general",
    type: "url",
    label: "URL publica",
    description: "Base URL para canonical, sitemap e compartilhamentos.",
    isPublic: true,
  },
  "general.supportEmail": {
    key: "general.supportEmail",
    value: "suporte@maxcinema.local",
    group: "general",
    type: "string",
    label: "Email de suporte",
    description: "Contato publico para suporte.",
    isPublic: true,
  },
  "general.companyName": {
    key: "general.companyName",
    value: "MaxCinema Studio",
    group: "general",
    type: "string",
    label: "Empresa/projeto",
    description: "Nome legal ou operacional do projeto.",
    isPublic: false,
  },
  "general.platformStatus": {
    key: "general.platformStatus",
    value: "online",
    group: "general",
    type: "select",
    label: "Status da plataforma",
    description: "Online, manutencao, privado ou somente admins.",
    isPublic: true,
  },
  "identity.logoUrl": {
    key: "identity.logoUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Logo principal",
    description: "URL da logo usada publicamente.",
    isPublic: true,
  },
  "identity.compactLogoUrl": {
    key: "identity.compactLogoUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Logo compacta",
    description: "Marca reduzida para sidebar e mobile.",
    isPublic: true,
  },
  "identity.adminLogoUrl": {
    key: "identity.adminLogoUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Logo do admin",
    description: "Marca exibida no Studio.",
    isPublic: false,
  },
  "identity.faviconUrl": {
    key: "identity.faviconUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Favicon",
    description: "Icone do navegador.",
    isPublic: true,
  },
  "identity.pwaIconUrl": {
    key: "identity.pwaIconUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Icone PWA",
    description: "Icone para instalacao futura.",
    isPublic: true,
  },
  "identity.shareImageUrl": {
    key: "identity.shareImageUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Imagem de compartilhamento",
    description: "Imagem padrao para Open Graph.",
    isPublic: true,
  },
  "identity.heroFallbackUrl": {
    key: "identity.heroFallbackUrl",
    value: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86",
    group: "identity",
    type: "url",
    label: "Hero fallback",
    description: "Imagem padrao para destaques sem arte.",
    isPublic: true,
  },
  "identity.posterFallbackUrl": {
    key: "identity.posterFallbackUrl",
    value: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&h=1350&q=86",
    group: "identity",
    type: "url",
    label: "Poster fallback",
    description: "Poster usado quando o conteudo nao tem imagem.",
    isPublic: true,
  },
  "identity.backdropFallbackUrl": {
    key: "identity.backdropFallbackUrl",
    value: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86",
    group: "identity",
    type: "url",
    label: "Backdrop fallback",
    description: "Imagem 16:9 usada quando falta backdrop.",
    isPublic: true,
  },
  "identity.avatarFallbackUrl": {
    key: "identity.avatarFallbackUrl",
    value: "",
    group: "identity",
    type: "url",
    label: "Avatar fallback",
    description: "Imagem padrao para perfis sem avatar.",
    isPublic: true,
  },
  "theme.primaryColor": {
    key: "theme.primaryColor",
    value: "#13c8ff",
    group: "theme",
    type: "color",
    label: "Cor primaria",
    description: "Acao principal, foco e highlights.",
    isPublic: true,
  },
  "theme.secondaryColor": {
    key: "theme.secondaryColor",
    value: "#ff9f43",
    group: "theme",
    type: "color",
    label: "Cor secundaria",
    description: "Acento editorial e estados especiais.",
    isPublic: true,
  },
  "theme.accentColor": {
    key: "theme.accentColor",
    value: "#e04cff",
    group: "theme",
    type: "color",
    label: "Cor de destaque",
    description: "Badges e pontos de interesse.",
    isPublic: true,
  },
  "theme.backgroundColor": {
    key: "theme.backgroundColor",
    value: "#030609",
    group: "theme",
    type: "color",
    label: "Fundo",
    description: "Base visual da plataforma.",
    isPublic: true,
  },
  "theme.cardColor": {
    key: "theme.cardColor",
    value: "#08131d",
    group: "theme",
    type: "color",
    label: "Cards",
    description: "Base dos paineis e superficies.",
    isPublic: true,
  },
  "theme.textColor": {
    key: "theme.textColor",
    value: "#f6fbff",
    group: "theme",
    type: "color",
    label: "Texto principal",
    description: "Cor de leitura principal.",
    isPublic: true,
  },
  "theme.mutedTextColor": {
    key: "theme.mutedTextColor",
    value: "#92a7b7",
    group: "theme",
    type: "color",
    label: "Texto secundario",
    description: "Metadados e ajuda contextual.",
    isPublic: true,
  },
  "theme.borderRadius": {
    key: "theme.borderRadius",
    value: 8,
    group: "theme",
    type: "number",
    label: "Raio de borda",
    description: "Raio padrao em px.",
    isPublic: true,
  },
  "theme.shadowIntensity": {
    key: "theme.shadowIntensity",
    value: 42,
    group: "theme",
    type: "number",
    label: "Intensidade de sombra",
    description: "Peso visual das sombras.",
    isPublic: true,
  },
  "theme.blurLevel": {
    key: "theme.blurLevel",
    value: 22,
    group: "theme",
    type: "number",
    label: "Blur",
    description: "Nivel de vidro e profundidade.",
    isPublic: true,
  },
  "seo.title": {
    key: "seo.title",
    value: "MaxCinema | Cinema OS 2026",
    group: "seo",
    type: "string",
    label: "SEO title",
    description: "Titulo padrao de paginas publicas.",
    isPublic: true,
  },
  "seo.description": {
    key: "seo.description",
    value: "Plataforma premium de streaming com interface Cinema OS 2026.",
    group: "seo",
    type: "string",
    label: "SEO description",
    description: "Descricao padrao para buscadores.",
    isPublic: true,
  },
  "seo.keywords": {
    key: "seo.keywords",
    value: "MaxCinema, streaming, filmes, series",
    group: "seo",
    type: "string",
    label: "Keywords",
    description: "Palavras-chave separadas por virgula.",
    isPublic: true,
  },
  "seo.ogTitle": {
    key: "seo.ogTitle",
    value: "MaxCinema",
    group: "seo",
    type: "string",
    label: "Open Graph title",
    description: "Titulo usado em redes sociais.",
    isPublic: true,
  },
  "seo.ogDescription": {
    key: "seo.ogDescription",
    value: "Streaming premium cinematografico.",
    group: "seo",
    type: "string",
    label: "Open Graph description",
    description: "Descricao usada em previews sociais.",
    isPublic: true,
  },
  "seo.robots": {
    key: "seo.robots",
    value: "index,follow",
    group: "seo",
    type: "select",
    label: "Robots",
    description: "Politica de indexacao.",
    isPublic: true,
  },
  "seo.canonicalUrl": {
    key: "seo.canonicalUrl",
    value: "",
    group: "seo",
    type: "url",
    label: "Canonical URL",
    description: "URL canonica padrao da plataforma.",
    isPublic: true,
  },
  "seo.twitterCard": {
    key: "seo.twitterCard",
    value: "summary_large_image",
    group: "seo",
    type: "select",
    label: "Twitter card",
    description: "Formato do card para X/Twitter.",
    isPublic: true,
  },
  "player.provider": {
    key: "player.provider",
    value: "hls",
    group: "player",
    type: "select",
    label: "Provider padrao",
    description: "local, hls, mux ou external.",
    isPublic: false,
  },
  "player.autoplayTrailer": {
    key: "player.autoplayTrailer",
    value: true,
    group: "player",
    type: "boolean",
    label: "Autoplay trailer",
    description: "Inicia trailers automaticamente quando permitido.",
    isPublic: true,
  },
  "player.showTrailerButton": {
    key: "player.showTrailerButton",
    value: true,
    group: "player",
    type: "boolean",
    label: "Mostrar botao trailer",
    description: "Exibe CTA de trailer quando disponivel.",
    isPublic: true,
  },
  "player.showFavoriteButton": {
    key: "player.showFavoriteButton",
    value: true,
    group: "player",
    type: "boolean",
    label: "Mostrar botao favoritos",
    description: "Exibe favoritos nos cards e hero.",
    isPublic: true,
  },
  "player.saveWatchProgress": {
    key: "player.saveWatchProgress",
    value: true,
    group: "player",
    type: "boolean",
    label: "Salvar progresso",
    description: "Registra progresso de reproducao.",
    isPublic: false,
  },
  "browse.cardsPerSection": {
    key: "browse.cardsPerSection",
    value: 12,
    group: "browse",
    type: "number",
    label: "Cards por secao",
    description: "Limite padrao para rails publicos.",
    isPublic: true,
  },
  "browse.showCollections": {
    key: "browse.showCollections",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar colecoes",
    description: "Exibe area publica de colecoes.",
    isPublic: true,
  },
  "browse.showTop10": {
    key: "browse.showTop10",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar Top 10",
    description: "Mantem rails de ranking editorial.",
    isPublic: true,
  },
  "browse.showOriginals": {
    key: "browse.showOriginals",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar Originais",
    description: "Exibe rails de conteudo original.",
    isPublic: true,
  },
  "browse.showRecommendations": {
    key: "browse.showRecommendations",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar recomendacoes",
    description: "Exibe secoes personalizadas.",
    isPublic: true,
  },
  "browse.showContinueWatching": {
    key: "browse.showContinueWatching",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar continuar assistindo",
    description: "Exibe progresso do usuario.",
    isPublic: true,
  },
  "browse.showRating": {
    key: "browse.showRating",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar nota",
    description: "Exibe rating nos cards.",
    isPublic: true,
  },
  "browse.showDuration": {
    key: "browse.showDuration",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar duracao",
    description: "Exibe duracao nos cards.",
    isPublic: true,
  },
  "browse.showGenres": {
    key: "browse.showGenres",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Mostrar generos",
    description: "Exibe generos nos cards.",
    isPublic: true,
  },
  "browse.heroRotating": {
    key: "browse.heroRotating",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Hero rotativo",
    description: "Alterna destaques automaticamente.",
    isPublic: true,
  },
  "browse.heroRotationMs": {
    key: "browse.heroRotationMs",
    value: 8500,
    group: "browse",
    type: "number",
    label: "Intervalo do hero",
    description: "Tempo de troca em milissegundos.",
    isPublic: true,
  },
  "browse.hideEmptySections": {
    key: "browse.hideEmptySections",
    value: true,
    group: "browse",
    type: "boolean",
    label: "Ocultar secoes vazias",
    description: "Remove rails sem conteudo do Browse.",
    isPublic: true,
  },
  "admin.compactMode": {
    key: "admin.compactMode",
    value: false,
    group: "admin",
    type: "boolean",
    label: "Modo compacto",
    description: "Reduz espacamento do Studio.",
    isPublic: false,
  },
  "admin.showMetrics": {
    key: "admin.showMetrics",
    value: true,
    group: "admin",
    type: "boolean",
    label: "Mostrar metricas",
    description: "Exibe cards numericos do Studio.",
    isPublic: false,
  },
  "admin.showPreviews": {
    key: "admin.showPreviews",
    value: true,
    group: "admin",
    type: "boolean",
    label: "Mostrar previews",
    description: "Exibe previews editoriais no admin.",
    isPublic: false,
  },
  "admin.confirmDangerousActions": {
    key: "admin.confirmDangerousActions",
    value: true,
    group: "admin",
    type: "boolean",
    label: "Confirmar acoes perigosas",
    description: "Mantem confirmacoes antes de excluir/resetar.",
    isPublic: false,
  },
  "admin.defaultListLayout": {
    key: "admin.defaultListLayout",
    value: "editorial",
    group: "admin",
    type: "select",
    label: "Layout padrao",
    description: "Tabela, grid, editorial ou compacto.",
    isPublic: false,
  },
  "media.maxPosterMb": {
    key: "media.maxPosterMb",
    value: 10,
    group: "media",
    type: "number",
    label: "Poster maximo MB",
    description: "Limite operacional para upload de poster.",
    isPublic: false,
  },
  "media.maxBackdropMb": {
    key: "media.maxBackdropMb",
    value: 12,
    group: "media",
    type: "number",
    label: "Backdrop maximo MB",
    description: "Limite operacional para backdrop.",
    isPublic: false,
  },
  "media.allowedImageFormats": {
    key: "media.allowedImageFormats",
    value: "jpg,jpeg,png,webp,avif",
    group: "media",
    type: "string",
    label: "Formatos de imagem",
    description: "Formatos aceitos separados por virgula.",
    isPublic: false,
  },
  "media.storageBucket": {
    key: "media.storageBucket",
    value: "media",
    group: "media",
    type: "string",
    label: "Bucket de storage",
    description: "Bucket padrao de uploads.",
    isPublic: false,
  },
  "integrations.supabaseEnabled": {
    key: "integrations.supabaseEnabled",
    value: true,
    group: "integrations",
    type: "boolean",
    label: "Supabase",
    description: "Banco, auth e storage.",
    isPublic: false,
  },
  "integrations.muxEnabled": {
    key: "integrations.muxEnabled",
    value: false,
    group: "integrations",
    type: "boolean",
    label: "Mux",
    description: "Preparado para playback Mux.",
    isPublic: false,
  },
  "security.publicRegistration": {
    key: "security.publicRegistration",
    value: true,
    group: "security",
    type: "boolean",
    label: "Cadastro publico",
    description: "Permite criar contas publicamente.",
    isPublic: false,
  },
  "security.maxProfiles": {
    key: "security.maxProfiles",
    value: 5,
    group: "security",
    type: "number",
    label: "Limite de perfis",
    description: "Perfis por conta.",
    isPublic: false,
  },
  "maintenance.enabled": {
    key: "maintenance.enabled",
    value: false,
    group: "maintenance",
    type: "boolean",
    label: "Modo manutencao",
    description: "Exibe bloqueio para usuarios comuns.",
    isPublic: true,
  },
  "maintenance.message": {
    key: "maintenance.message",
    value: "Estamos atualizando o MaxCinema.",
    group: "maintenance",
    type: "string",
    label: "Mensagem de manutencao",
    description: "Texto exibido publicamente.",
    isPublic: true,
  },
  "footer.text": {
    key: "footer.text",
    value: "MaxCinema. Streaming editorial premium.",
    group: "footer",
    type: "string",
    label: "Texto do rodape",
    description: "Assinatura institucional.",
    isPublic: true,
  },
  "footer.instagram": {
    key: "footer.instagram",
    value: "",
    group: "footer",
    type: "url",
    label: "Instagram",
    description: "Link social.",
    isPublic: true,
  },
  "footer.youtube": {
    key: "footer.youtube",
    value: "",
    group: "footer",
    type: "url",
    label: "YouTube",
    description: "Link social.",
    isPublic: true,
  },
  "footer.termsUrl": {
    key: "footer.termsUrl",
    value: "",
    group: "footer",
    type: "url",
    label: "Termos de uso",
    description: "URL de termos.",
    isPublic: true,
  },
  "footer.privacyUrl": {
    key: "footer.privacyUrl",
    value: "",
    group: "footer",
    type: "url",
    label: "Politica de privacidade",
    description: "URL de privacidade.",
    isPublic: true,
  },
  "advanced.cacheEnabled": {
    key: "advanced.cacheEnabled",
    value: true,
    group: "advanced",
    type: "boolean",
    label: "Cache ligado",
    description: "Controle operacional para cache futuro.",
    isPublic: false,
  },
  "advanced.debugMode": {
    key: "advanced.debugMode",
    value: false,
    group: "advanced",
    type: "boolean",
    label: "Modo debug",
    description: "Ativa sinais tecnicos no admin.",
    isPublic: false,
  },
};

export const SETTINGS_GROUP_LABELS: Record<SettingGroup, string> = {
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

function mapRow(row: SettingRow): SiteSetting {
  const fallback = DEFAULT_SETTINGS[row.key];
  return {
    id: row.id,
    key: row.key,
    value: row.value ?? fallback?.value ?? null,
    group: row.group ?? fallback?.group ?? "advanced",
    type: row.type ?? fallback?.type ?? "json",
    label: row.label ?? fallback?.label ?? row.key,
    description: row.description ?? fallback?.description ?? "",
    isPublic: row.is_public ?? fallback?.isPublic ?? false,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mergeWithDefaults(rows: SiteSetting[]) {
  const merged: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const setting of rows) {
    merged[setting.key] = {
      ...(DEFAULT_SETTINGS[setting.key] ?? setting),
      ...setting,
    };
  }
  return merged;
}

export function getSettingValue<T>(settings: SettingsMap, key: string, fallback: T): T {
  const value = settings[key]?.value;
  return value === undefined || value === null || value === "" ? fallback : (value as T);
}

export async function getSettings(): Promise<SettingsMap> {
  if (!hasSupabaseEnv()) return DEFAULT_SETTINGS;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("id, key, value, group, type, label, description, is_public, updated_at")
      .order("group", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      const legacy = await supabase
        .from("site_settings")
        .select("id, key, value, updated_at")
        .order("key", { ascending: true });

      if (legacy.error) throw error;
      return mergeWithDefaults(((legacy.data ?? []) as unknown as SettingRow[]).map(mapRow));
    }

    return mergeWithDefaults(((data ?? []) as unknown as SettingRow[]).map(mapRow));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getPublicSettings(): Promise<SettingsMap> {
  const settings = await getSettings();
  return Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.isPublic));
}

export async function getSetting(key: string) {
  const settings = await getSettings();
  return settings[key];
}

export async function updateSetting(key: string, value: unknown, actorId?: string) {
  return updateSettingsBulk({ [key]: value }, actorId);
}

export async function updateSettingsBulk(values: Record<string, unknown>, actorId?: string) {
  if (!hasSupabaseEnv()) return mergeWithDefaults(Object.entries(values).map(([key, value]) => ({ ...DEFAULT_SETTINGS[key], key, value } as SiteSetting)));

  const supabase = await createSupabaseServerClient();
  const rows = Object.entries(values).map(([key, value]) => {
    const fallback = DEFAULT_SETTINGS[key];
    return {
      key,
      value,
      group: fallback?.group ?? "advanced",
      type: fallback?.type ?? "json",
      label: fallback?.label ?? key,
      description: fallback?.description ?? "",
      is_public: fallback?.isPublic ?? false,
      updated_by: actorId ?? null,
    };
  });

  const { error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    const legacyRows = Object.entries(values).map(([key, value]) => ({ key, value }));
    const { error: legacyError } = await supabase
      .from("site_settings")
      .upsert(legacyRows, { onConflict: "key" });

    if (legacyError) throw error;
  }

  return getSettings();
}

export async function resetSettings(actorId?: string) {
  const values = Object.fromEntries(Object.entries(DEFAULT_SETTINGS).map(([key, setting]) => [key, setting.value]));
  return updateSettingsBulk(values, actorId);
}

export async function exportSettings() {
  const settings = await getSettings();
  return Object.fromEntries(Object.entries(settings).map(([key, setting]) => [key, setting.value]));
}

export async function importSettings(values: Record<string, unknown>, actorId?: string) {
  return updateSettingsBulk(values, actorId);
}

export async function getThemeSettings() {
  const settings = await getSettings();
  return Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.group === "theme"));
}

export async function getPlayerSettings() {
  const settings = await getSettings();
  return Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.group === "player"));
}

export async function getBrowseSettings() {
  const settings = await getSettings();
  return Object.fromEntries(Object.entries(settings).filter(([, setting]) => setting.group === "browse"));
}
