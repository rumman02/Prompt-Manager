import { PromptListItem } from "./PromptListItem";
import type { PromptRow } from "@/types";

interface PromptListTableProps {
  prompts: PromptRow[];
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptListTable({ prompts, onSelect, onEdit, onDelete, onDuplicate, onToggleFavorite }: PromptListTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="grid grid-cols-[1fr_8rem_10rem_6rem_auto] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>Title</span>
        <span className="text-center">Category</span>
        <span className="text-center">Content</span>
        <span className="text-right">Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {prompts.map((prompt) => (
          <PromptListItem
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
