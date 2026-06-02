import {
  Film,
  Heart,
  Home,
  Library,
  Settings,
  Sparkles,
  Tv,
  type LucideIcon,
} from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  settingKey?: "browse.showOriginals" | "browse.showCollections" | "browse.showContinueWatching";
};

export const cinematicNav: SidebarItem[] = [
  { href: "/browse", label: "Inicio", icon: Home, exact: true },
  { href: "/browse#filmes", label: "Filmes", icon: Film },
  { href: "/browse#series", label: "Series", icon: Tv },
  { href: "/browse#originais", label: "Originais", icon: Sparkles, settingKey: "browse.showOriginals" },
  { href: "/browse/collections", label: "Colecoes", icon: Library, settingKey: "browse.showCollections" },
  { href: "/favorites", label: "Minha lista", icon: Heart },
  { href: "/continue-watching", label: "Continuar", icon: Library, settingKey: "browse.showContinueWatching" },
  { href: "/admin", label: "Admin", icon: Settings },
];
