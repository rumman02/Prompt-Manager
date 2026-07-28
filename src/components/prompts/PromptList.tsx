import { type ReactNode } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListTable } from "./PromptListTable";
import { EmptyPromptsState } from "./EmptyPromptsState";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { PromptRow } from "@/types";

interface PromptListProps {
  prompts: PromptRow[];
  viewMode: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  showHeader?: boolean;
  headerTitle?: string;
  headerIcon?: ReactNode;
  headerSubtitle?: string;
  onLoadDemo?: () => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onCreatePrompt?: () => void;
  autoFocusSearch?: boolean;
  onSearchFocused?: () => void;
}

export function PromptList({
  prompts,
  viewMode,
  onViewModeChange,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  showHeader,
  headerTitle,
  headerIcon,
  headerSubtitle,
  onLoadDemo,
  searchQuery,
  onSearch,
  onCreatePrompt,
  autoFocusSearch,
  onSearchFocused,
}: PromptListProps) {
  return (
    <div className="flex flex-col h-full">
      {showHeader && headerTitle && (
        <PageHeader
          icon="prompts"
          title={headerTitle}
          subtitle={headerSubtitle ?? "Browse your prompts"}
          actions={
            (onSearch || onCreatePrompt || onViewModeChange) ? (
              <div className="flex items-center gap-3">
                {onSearch && (
                  <SearchBar
                    value={searchQuery ?? ""}
                    onChange={onSearch}
                    placeholder="Search prompts..."
                    autoFocus={autoFocusSearch}
                    onFocus={onSearchFocused}
                  />
                )}
                {onCreatePrompt && (
                  <Button onClick={onCreatePrompt} className="gap-2">
                    <Icon name="add" size="sm" />
                    Add Prompt
                  </Button>
                )}
                {onViewModeChange && (
                  <div className="inline-flex h-8 rounded-lg bg-muted p-1 shadow-macos-inset">
                    <button
                      onClick={() => onViewModeChange("list")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                        viewMode === "list"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => onViewModeChange("grid")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                        viewMode === "grid"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Grid
                    </button>
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      )}
      <div className="flex-1 overflow-auto p-6">
        {prompts.length === 0 ? (
          <EmptyPromptsState
            icon="prompts"
            title="No prompts yet"
            description="Create your first prompt to get started."
          />
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={prompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <PromptListTable
            prompts={prompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}
