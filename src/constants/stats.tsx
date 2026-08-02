import type { IconName } from "@/components/ui/icon";

export interface StatConfig {
  title: string;
  icon: IconName;
  /** Restrained accent — uses the single primary accent, not rainbow palette */
  accent?: boolean;
  /** Muted secondary line rendered in the stat-card footer */
  hint?: string;
}

export const STAT_CONFIGS: StatConfig[] = [
  { title: "Agents", icon: "agents", hint: "Configured in your workspace" },
  { title: "Skills", icon: "skills", hint: "Capabilities at your disposal" },
  { title: "Prompts", icon: "prompts", hint: "Across your entire library" },
  { title: "Categories", icon: "categories", hint: "Groups for organizing prompts" },
  { title: "Favorites", icon: "favorites", hint: "Starred for quick access" },
  { title: "Tags", icon: "tags", hint: "Cross-cutting labels" },
  { title: "Trash", icon: "trash", hint: "Auto-purged after retention" },
];
