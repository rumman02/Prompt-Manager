import type { IconName } from "@/components/ui/icon";

export type ViewType = "dashboard" | "prompts" | "agents" | "skills" | "favorites" | "categories" | "tags" | "trash" | "settings";

export interface NavItem {
  id: "dashboard" | "prompts" | "agents" | "skills" | "favorites" | "categories" | "tags" | "trash";
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "agents", label: "Agents", icon: "agents" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "prompts", label: "Prompts", icon: "prompts" },
  { id: "categories", label: "Categories", icon: "categories" },
  { id: "favorites", label: "Favorites", icon: "favorites" },
  { id: "tags", label: "Tags", icon: "tags" },
  { id: "trash", label: "Trash", icon: "trash" },
];

export const VIEW_TITLES: Record<ViewType, string> = {
  dashboard: "Dashboard",
  prompts: "Prompts",
  agents: "Agents",
  skills: "Skills",
  favorites: "Favorites",
  categories: "Categories",
  tags: "Tags",
  trash: "Trash",
  settings: "Settings",
};
