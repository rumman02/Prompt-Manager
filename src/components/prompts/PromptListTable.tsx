import { PromptListItem } from "./PromptListItem";
import { getContentStats } from "@/lib/utils";
import type { PromptRow } from "@/types";

interface PromptListTableProps {
  prompts: PromptRow[];
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptListTable({ prompts, onSelect, onEdit, onDelete, onToggleFavorite }: PromptListTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>Title</span>
        <span className="text-center">Category</span>
        <span className="w-40 text-center">Content</span>
        <span className="w-24 text-right">Updated</span>
        <span></span>
      </div>
      <div className="divide-y">
        {prompts.map((prompt) => (
          <PromptListItem
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
