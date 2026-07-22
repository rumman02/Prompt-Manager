import { PromptGrid } from "./PromptGrid";
import { PromptListTable } from "./PromptListTable";
import { EmptyPromptsState } from "./EmptyPromptsState";
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
  onLoadDemo: () => void;
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
  onLoadDemo,
}: PromptListProps) {
  return (
    <div className="space-y-4">
      {showHeader && headerTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{headerTitle}</h2>
            <p className="text-sm text-muted-foreground">Browse your prompts</p>
          </div>
          {onViewModeChange && (
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
          )}
        </div>
      )}

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
  );
}
