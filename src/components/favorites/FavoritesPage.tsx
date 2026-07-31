import { useMemo, useState } from "react";
import { PromptList } from "@/components/prompts/PromptList";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const allFavorites = useMemo(
    () => prompts.filter((p) => p.is_favorite),
    [prompts]
  );
  const nonFavorites = useMemo(
    () => prompts.filter((p) => !p.is_favorite),
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
        icon="favorites"
        title="Favorites"
        subtitle={`${favoritePrompts.length} favorited prompt${favoritePrompts.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search favorites..."
            />
            <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Icon name="add" size="sm" />
              Add Favorite
            </Button>
          </div>
        }
      />
      {favoritePrompts.length === 0 ? (
        <div className="flex-1 overflow-auto p-6">
          <EmptyState
            icon="favorites"
            title="No favorites yet"
            description="Prompts you mark as favorites will appear here. Tap the heart on any prompt to save it."
          />
        </div>
      ) : (
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
      )}

      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedId(null);
        }}
        title="Add Favorite"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setSelectedId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) onToggleFavorite(selectedId);
                setIsAddModalOpen(false);
                setSelectedId(null);
              }}
            >
              Add Favorite
            </Button>
          </>
        }
      >
        {nonFavorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All prompts are already favorited.
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="add-favorite-prompt">Select Prompt</Label>
            <Dropdown
              id="add-favorite-prompt"
              value={selectedId !== null ? String(selectedId) : ""}
              onChange={(value) => setSelectedId(Number(value))}
              options={nonFavorites.map((p) => ({
                value: String(p.id),
                label: p.title,
              }))}
              placeholder="Choose a prompt..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
