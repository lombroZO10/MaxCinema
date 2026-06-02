-- MaxCinema Control Panel settings.

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  "group" text not null default 'advanced',
  type text not null default 'json',
  label text not null default '',
  description text not null default '',
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists "group" text not null default 'advanced',
  add column if not exists type text not null default 'json',
  add column if not exists label text not null default '',
  add column if not exists description text not null default '',
  add column if not exists is_public boolean not null default false,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create index if not exists site_settings_group_idx on public.site_settings ("group", key);
create index if not exists site_settings_public_idx on public.site_settings (is_public) where is_public = true;

alter table public.site_settings enable row level security;

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

insert into public.site_settings (key, value, "group", type, label, description, is_public)
values
  ('general.siteName', '"MaxCinema"', 'general', 'string', 'Nome do site', 'Nome publico usado no Browse, SEO e Admin.', true),
  ('general.slogan', '"Cinema OS para uma nova era de streaming."', 'general', 'string', 'Slogan', 'Frase curta para hero, previews e compartilhamentos.', true),
  ('general.platformStatus', '"online"', 'general', 'select', 'Status da plataforma', 'Online, manutencao, privado ou somente admins.', true),
  ('identity.logoUrl', '""', 'identity', 'url', 'Logo principal', 'URL da logo usada publicamente.', true),
  ('identity.shareImageUrl', '""', 'identity', 'url', 'Imagem de compartilhamento', 'Imagem padrao para Open Graph.', true),
  ('identity.backdropFallbackUrl', '"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&h=1200&q=86"', 'identity', 'url', 'Backdrop fallback', 'Imagem 16:9 usada quando falta backdrop.', true),
  ('identity.avatarFallbackUrl', '""', 'identity', 'url', 'Avatar fallback', 'Imagem padrao para perfis sem avatar.', true),
  ('theme.primaryColor', '"#13c8ff"', 'theme', 'color', 'Cor primaria', 'Acao principal, foco e highlights.', true),
  ('theme.secondaryColor', '"#ff9f43"', 'theme', 'color', 'Cor secundaria', 'Acento editorial e estados especiais.', true),
  ('theme.accentColor', '"#e04cff"', 'theme', 'color', 'Cor de destaque', 'Badges e pontos de interesse.', true),
  ('theme.backgroundColor', '"#030609"', 'theme', 'color', 'Fundo', 'Base visual da plataforma.', true),
  ('theme.cardColor', '"#08131d"', 'theme', 'color', 'Cards', 'Base dos paineis e superficies.', true),
  ('theme.textColor', '"#f6fbff"', 'theme', 'color', 'Texto principal', 'Cor de leitura principal.', true),
  ('theme.mutedTextColor', '"#92a7b7"', 'theme', 'color', 'Texto secundario', 'Metadados e ajuda contextual.', true),
  ('seo.title', '"MaxCinema | Cinema OS 2026"', 'seo', 'string', 'SEO title', 'Titulo padrao de paginas publicas.', true),
  ('seo.description', '"Plataforma premium de streaming com interface Cinema OS 2026."', 'seo', 'string', 'SEO description', 'Descricao padrao para buscadores.', true),
  ('seo.canonicalUrl', '""', 'seo', 'url', 'Canonical URL', 'URL canonica padrao da plataforma.', true),
  ('seo.twitterCard', '"summary_large_image"', 'seo', 'select', 'Twitter card', 'Formato do card para X/Twitter.', true),
  ('player.provider', '"hls"', 'player', 'select', 'Provider padrao', 'local, hls, mux ou external.', false),
  ('player.showTrailerButton', 'true', 'player', 'boolean', 'Mostrar botao trailer', 'Exibe CTA de trailer quando disponivel.', true),
  ('player.showFavoriteButton', 'true', 'player', 'boolean', 'Mostrar botao favoritos', 'Exibe favoritos nos cards e hero.', true),
  ('browse.cardsPerSection', '12', 'browse', 'number', 'Cards por secao', 'Limite padrao para rails publicos.', true),
  ('browse.showRecommendations', 'true', 'browse', 'boolean', 'Mostrar recomendacoes', 'Exibe secoes personalizadas.', true),
  ('browse.showContinueWatching', 'true', 'browse', 'boolean', 'Mostrar continuar assistindo', 'Exibe progresso do usuario.', true),
  ('browse.showRating', 'true', 'browse', 'boolean', 'Mostrar nota', 'Exibe rating nos cards.', true),
  ('browse.showDuration', 'true', 'browse', 'boolean', 'Mostrar duracao', 'Exibe duracao nos cards.', true),
  ('browse.showGenres', 'true', 'browse', 'boolean', 'Mostrar generos', 'Exibe generos nos cards.', true),
  ('browse.heroRotating', 'true', 'browse', 'boolean', 'Hero rotativo', 'Alterna destaques automaticamente.', true),
  ('browse.heroRotationMs', '8500', 'browse', 'number', 'Intervalo do hero', 'Tempo de troca em milissegundos.', true),
  ('admin.compactMode', 'false', 'admin', 'boolean', 'Modo compacto', 'Reduz espacamento do Studio.', false),
  ('admin.showMetrics', 'true', 'admin', 'boolean', 'Mostrar metricas', 'Exibe cards numericos do Studio.', false),
  ('admin.showPreviews', 'true', 'admin', 'boolean', 'Mostrar previews', 'Exibe previews editoriais no admin.', false),
  ('admin.confirmDangerousActions', 'true', 'admin', 'boolean', 'Confirmar acoes perigosas', 'Mantem confirmacoes antes de excluir/resetar.', false),
  ('media.storageBucket', '"media"', 'media', 'string', 'Bucket de storage', 'Bucket padrao de uploads.', false),
  ('media.maxBackdropMb', '12', 'media', 'number', 'Backdrop maximo MB', 'Limite operacional para backdrop.', false),
  ('media.allowedImageFormats', '"jpg,jpeg,png,webp,avif"', 'media', 'string', 'Formatos de imagem', 'Formatos aceitos separados por virgula.', false),
  ('integrations.supabaseEnabled', 'true', 'integrations', 'boolean', 'Supabase', 'Banco, auth e storage.', false),
  ('security.publicRegistration', 'true', 'security', 'boolean', 'Cadastro publico', 'Permite criar contas publicamente.', false),
  ('maintenance.enabled', 'false', 'maintenance', 'boolean', 'Modo manutencao', 'Exibe bloqueio para usuarios comuns.', true),
  ('footer.text', '"MaxCinema. Streaming editorial premium."', 'footer', 'string', 'Texto do rodape', 'Assinatura institucional.', true),
  ('footer.youtube', '""', 'footer', 'url', 'YouTube', 'Link social.', true),
  ('footer.termsUrl', '""', 'footer', 'url', 'Termos de uso', 'URL de termos.', true),
  ('footer.privacyUrl', '""', 'footer', 'url', 'Politica de privacidade', 'URL de privacidade.', true),
  ('advanced.cacheEnabled', 'true', 'advanced', 'boolean', 'Cache ligado', 'Controle operacional para cache futuro.', false)
on conflict (key) do update
set
  "group" = excluded."group",
  type = excluded.type,
  label = excluded.label,
  description = excluded.description,
  is_public = excluded.is_public;
