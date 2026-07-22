import { type ReactNode } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListTable } from "./PromptListTable";
import { EmptyPromptsState } from "./EmptyPromptsState";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import type { PromptRow } from "@/types";

interface PromptListProps {
  prompts: PromptRow[];
  viewMode: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  showHeader?: boolean;
  headerTitle?: string;
  headerIcon?: ReactNode;
  headerSubtitle?: string;
  onLoadDemo: () => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onCreatePrompt?: () => void;
}

export function PromptList({
  prompts,
  viewMode,
  onViewModeChange,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  showHeader,
  headerTitle,
  headerIcon,
  headerSubtitle,
  onLoadDemo,
  searchQuery,
  onSearch,
  onCreatePrompt,
}: PromptListProps) {
  return (
    <div className="flex flex-col h-full">
      {showHeader && headerTitle && (
        <PageHeader
          icon={
            headerIcon ?? (
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
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            )
          }
          title={headerTitle}
          subtitle={headerSubtitle ?? "Browse your prompts"}
          actions={
            onViewModeChange ? (
              <div className="flex items-center gap-3">
                {onSearch && (
                  <SearchBar
                    value={searchQuery ?? ""}
                    onChange={onSearch}
                    placeholder="Search prompts..."
                  />
                )}
                {onCreatePrompt && (
                  <Button onClick={onCreatePrompt} size="sm" className="gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Prompt
                  </Button>
                )}
                <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
                  <button
                    onClick={() => onViewModeChange("list")}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => onViewModeChange("grid")}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Grid
                  </button>
                </div>
              </div>
            ) : undefined
          }
        />
      )}
      <div className="flex-1 overflow-auto p-6">
        {prompts.length === 0 ? (
          <EmptyPromptsState onLoadDemo={onLoadDemo} />
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={prompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <PromptListTable
            prompts={prompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}
