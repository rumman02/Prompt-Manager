import { useMemo, useState } from "react";
import { PromptList } from "@/components/prompts/PromptList";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
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
}: FavoritesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const allFavorites = useMemo(
    () => prompts.filter((p) => p.is_favorite),
    [prompts]
  );
  const favoritePrompts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allFavorites;
    return allFavorites.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [allFavorites, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon={
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
        title="Favorites"
        subtitle={`${favoritePrompts.length} favorited prompt${favoritePrompts.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search favorites..."
            />
            <Button disabled className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Favorite
            </Button>
          </div>
        }
      />
      <PromptList
        prompts={favoritePrompts}
        viewMode={viewMode}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleFavorite={onToggleFavorite}
        showHeader={false}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onCreatePrompt={undefined}
      />
    </div>
  );
}
