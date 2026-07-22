export interface PromptRow {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  description: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export type ViewMode = "list" | "grid";
