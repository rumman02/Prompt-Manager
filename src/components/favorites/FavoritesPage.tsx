import { useMemo, useState } from "react";
import { PromptList } from "@/components/prompts/PromptList";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import type { PromptRow } from "@/types";

interface FavoritesPageProps {
  prompts?: PromptRow[];
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
  const {
    items,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  } = usePaginatedList<PromptRow>({
    command: "get_favorites_page",
    search: searchQuery,
    sort: "updated_desc",
  });
  const nonFavorites = useMemo(
    () => (prompts ?? []).filter((p) => !p.is_favorite),
    [prompts]
  );

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="favorites"
        title="Favorites"
        subtitle={`${total} favorited prompt${total !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
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
      {isLoading && items.length === 0 ? (
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : error && items.length === 0 ? (
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 overflow-auto p-6">
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon name="favorites" size="xl" className="text-primary" />
              </div>
              <h3 className="text-lg font-medium">No favorites yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Prompts you mark as favorites will appear here. Tap the heart on any prompt to save it.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <PromptList
            prompts={items}
            viewMode={viewMode}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={(id) => {
              onToggleFavorite(id);
              reload();
            }}
            loadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            error={error}
            total={total}
            showHeader={false}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onCreatePrompt={undefined}
          />
        </>
      )}

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAddModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Favorite</DialogTitle>
          </DialogHeader>
          {prompts ? (
            nonFavorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All prompts are already favorited.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="add-favorite-prompt">Select Prompt</Label>
                <Select
                  value={selectedId !== null ? String(selectedId) : ""}
                  onValueChange={(value) => setSelectedId(Number(value))}
                >
                  <SelectTrigger id="add-favorite-prompt">
                    <SelectValue placeholder="Choose a prompt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nonFavorites.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  onToggleFavorite(selectedId);
                  reload();
                }
                closeAddModal();
              }}
            >
              Add Favorite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
