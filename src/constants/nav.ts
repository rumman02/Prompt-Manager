import type { IconName } from "@/components/ui/icon";

export type ViewType = "dashboard" | "prompts" | "favorites" | "categories" | "tags" | "trash" | "settings";

export interface NavItem {
  id: "dashboard" | "prompts" | "favorites" | "categories" | "tags" | "trash";
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "prompts", label: "Prompts", icon: "prompts" },
  { id: "categories", label: "Categories", icon: "categories" },
  { id: "favorites", label: "Favorites", icon: "favorites" },
  { id: "tags", label: "Tags", icon: "tags" },
  { id: "trash", label: "Trash", icon: "trash" },
];
