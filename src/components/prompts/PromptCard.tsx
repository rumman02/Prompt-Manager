import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getContentStats, truncate } from "@/lib/utils";
import {
  PromptActionsMenu,
  type PromptActionsMenuHandle,
} from "./PromptActionsMenu";
import type { PromptRow } from "@/types";

interface PromptCardProps {
  prompt: PromptRow;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

/* macOS card: rounded-14, subtle border + shadow, accent tint on hover. */
export function PromptCard({
  prompt,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: PromptCardProps) {
  const stats = getContentStats(prompt.content);
  const actionsRef = useRef<PromptActionsMenuHandle>(null);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-macos-popover hover:border-primary/30 group"
      onClick={() => onSelect(prompt)}
      onContextMenu={(e) => actionsRef.current?.openContextMenu(e)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
            {prompt.title}
          </CardTitle>
          <PromptActionsMenu
            ref={actionsRef}
            prompt={prompt}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        {prompt.category && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
            {prompt.category}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncate(prompt.description || prompt.content, 120)}
        </p>
        {prompt.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prompt.tags.split(",").map((tag, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-caption text-muted-foreground">{formatDate(prompt.updated_at)}</p>
        <div className="mt-2 flex items-center gap-3 text-caption text-muted-foreground/80">
          <span>~{stats.tokens} tokens</span>
          <span>{stats.words} words</span>
          <span>{stats.sentences} sentences</span>
          <span>{stats.paragraphs} paragraphs</span>
        </div>
      </CardContent>
    </Card>
  );
}
