export type RecommendationSectionType =
  | "recommended_for_you"
  | "trending_for_profile"
  | "binge_now"
  | "discover_different"
  | "tonight_picks"
  | "based_on_favorites"
  | "because_you_watched"
  | "continue_watching"
  | "high_rated"
  | "new_releases"
  | "popular";

export const RECOMMENDATION_SECTION_OPTIONS: { value: RecommendationSectionType; label: string; description: string }[] = [
  { value: "recommended_for_you", label: "Recomendados para voce", description: "Favoritos, progresso, generos e qualidade." },
  { value: "trending_for_profile", label: "Tendencias para seu perfil", description: "Popularidade real com afinidade do perfil." },
  { value: "binge_now", label: "Maratone agora", description: "Series e conteudos longos com afinidade." },
  { value: "discover_different", label: "Descubra algo diferente", description: "Diversidade fora do padrao do usuario." },
  { value: "tonight_picks", label: "Filmes para hoje a noite", description: "Duracao confortavel, nota alta e horario." },
  { value: "based_on_favorites", label: "Baseado nos seus favoritos", description: "Conteudos relacionados ao que foi favoritado." },
  { value: "because_you_watched", label: "Porque voce assistiu...", description: "Relacionados ao ultimo conteudo assistido." },
  { value: "continue_watching", label: "Continuar assistindo", description: "Progresso real do perfil ativo." },
  { value: "high_rated", label: "Alta avaliacao", description: "Conteudos publicados com melhor nota." },
  { value: "new_releases", label: "Lancamentos para voce", description: "Conteudo recente com afinidade." },
  { value: "popular", label: "Populares no MaxCinema", description: "Score de popularidade e recomendacao." },
];
