import { PromptGrid } from "./PromptGrid";
import { PromptListTable } from "./PromptListTable";
import { EmptyPromptsState } from "./EmptyPromptsState";
import type { PromptRow } from "@/types";

interface PromptListProps {
  prompts: PromptRow[];
  viewMode: "list" | "grid";
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
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{headerTitle}</h2>
          <p className="text-sm text-muted-foreground">Browse your prompts</p>
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
