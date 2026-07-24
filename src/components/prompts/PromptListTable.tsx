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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-macos-window grid grid-cols-[1fr_8rem_10rem_6rem_auto] gap-x-4 auto-rows-auto">
      <div className="grid col-span-5 grid-cols-subgrid border-b border-border bg-muted/40 px-4 py-2.5 text-eyebrow text-muted-foreground">
        <span>Title</span>
        <span className="text-center">Category</span>
        <span className="text-center">Content</span>
        <span className="text-right">Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="grid col-span-5 grid-cols-subgrid divide-y divide-border contents">
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
