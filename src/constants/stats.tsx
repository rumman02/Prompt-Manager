import type { IconName } from "@/components/ui/icon";

export interface StatConfig {
  title: string;
  icon: IconName;
  /** Restrained accent — uses the single primary accent, not rainbow palette */
  accent?: boolean;
}

export const STAT_CONFIGS: StatConfig[] = [
  { title: "Agents", icon: "agents" },
  { title: "Skills", icon: "skills" },
  { title: "Prompts", icon: "prompts" },
  { title: "Categories", icon: "categories" },
  { title: "Favorites", icon: "favorites" },
  { title: "Tags", icon: "tags" },
  { title: "Trash", icon: "trash" },
];
