import { useRef } from "react";
import { formatDate, getContentStats, truncate } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Icon, isIconName } from "@/components/ui/icon";
import {
  PromptActionsMenu,
  type PromptActionsMenuHandle,
} from "./PromptActionsMenu";
import type { PromptRow } from "@/types";

interface PromptListItemProps {
  prompt: PromptRow;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptListItem({
  prompt,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: PromptListItemProps) {
  const stats = getContentStats(prompt.content);
  const actionsRef = useRef<PromptActionsMenuHandle>(null);

  return (
    <div
      className="group grid col-span-5 grid-cols-subgrid gap-x-4 items-start px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors duration-150"
      onClick={() => onSelect(prompt)}
      onContextMenu={(e) => actionsRef.current?.openContextMenu(e)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
          <Icon name={isIconName(prompt.icon) ? prompt.icon : "file"} size="sm" className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-subheadline font-medium truncate">{prompt.title}</p>
          </div>
          <p className="text-footnote text-muted-foreground truncate">
            {truncate(prompt.description || prompt.content, 60)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        {prompt.category && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
            {prompt.category}
          </span>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center cursor-default">
            <div className="flex flex-col items-center text-caption text-muted-foreground leading-tight">
              <span className="font-medium text-foreground">
                ~{stats.tokens}
              </span>
              <span>{stats.words}w · {stats.sentences}s</span>
            </div>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>~{stats.tokens} tokens</span>
            <span>{stats.words} Words</span>
            <span>{stats.sentences} Sentences</span>
            <span>{stats.paragraphs} Paragraphs</span>
          </div>
        </TooltipContent>
      </Tooltip>
      <span className="text-right text-caption text-muted-foreground">
        {formatDate(prompt.updated_at)}
      </span>

      {/* actions — flush-right, single 3-dot button (button itself fades in on hover) */}
      <PromptActionsMenu
        ref={actionsRef}
        prompt={prompt}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleFavorite={onToggleFavorite}
        className="flex items-start justify-end"
      />
    </div>
  );
}
