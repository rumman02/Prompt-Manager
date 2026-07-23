import { useMemo } from "react";
import { PromptList } from "@/components/prompts/PromptList";
import type { PromptRow } from "@/types";

interface FavoritesPageProps {
  prompts: PromptRow[];
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onLoadDemo: () => void;
}

export function FavoritesPage({
  prompts,
  viewMode,
  onViewModeChange,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onLoadDemo,
}: FavoritesPageProps) {
  const favoritePrompts = useMemo(
    () => prompts.filter((p) => p.is_favorite),
    [prompts]
  );

  return (
    <PromptList
      prompts={favoritePrompts}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      onSelect={onSelect}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onToggleFavorite={onToggleFavorite}
      showHeader
      headerTitle="Favorites"
      headerSubtitle={`${
        favoritePrompts.length
      } favorited prompt${favoritePrompts.length !== 1 ? "s" : ""}`}
      headerIcon={
        <svg
          className="h-5 w-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      }
      onLoadDemo={onLoadDemo}
      searchQuery=""
      onSearch={() => {}}
      onCreatePrompt={undefined}
    />
  );
}
