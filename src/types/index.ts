export interface PromptRow {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  description: string | null;
  icon: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface PromptVersion {
  id: number;
  prompt_id: number;
  version_number: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  description: string | null;
  message: string | null;
  created_at: string;
}

export interface VariableSet {
  id: number;
  name: string;
  isActive: boolean;
}

export type ViewMode = "list" | "grid";

/** One entry returned by the `global_search` Tauri command. */
export interface GlobalSearchHit {
  id: string;
  kind: "prompt" | "category" | "tag";
  title: string;
  subtitle: string | null;
  snippet: string | null;
}

export * from "./vault";
