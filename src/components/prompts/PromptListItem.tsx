import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Icon, isIconName } from "@/components/ui/icon";
import { formatDate, getContentStats, truncate } from "@/lib/utils";
import { PromptActionsMenu, PromptMenuItems } from "./PromptActionsMenu";
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
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            className="cursor-pointer"
            onClick={() => onSelect(prompt)}
          >
            <TableCell className="max-w-[24rem] px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                  aria-hidden="true"
                >
                  <Icon
                    name={isIconName(prompt.icon) ? prompt.icon : "file"}
                    size="md"
                    className="text-primary"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{prompt.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {truncate(prompt.description || prompt.content, 60)}
                  </p>
                </div>
              </div>
            </TableCell>

            <TableCell className="px-4 text-center">
              {prompt.category && (
                <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary hover:bg-primary/10">
                  {prompt.category}
                </Badge>
              )}
            </TableCell>

            <TableCell className="px-4 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">
                    <div className="flex flex-col items-center text-xs leading-tight text-muted-foreground">
                      <span className="font-medium text-foreground">~{stats.tokens}</span>
                      <span>
                        {stats.words}w · {stats.sentences}s
                      </span>
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
            </TableCell>

            <TableCell className="whitespace-nowrap px-4 text-right text-xs text-muted-foreground">
              {formatDate(prompt.updated_at)}
            </TableCell>

            <TableCell className="px-4 text-right">
              <PromptActionsMenu
                prompt={prompt}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onToggleFavorite={onToggleFavorite}
                onDeleteRequest={() => setDeleteOpen(true)}
              />
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-[11rem]">
          <PromptMenuItems
            menu="context"
            prompt={prompt}
            onEdit={onEdit}
            onDeleteRequest={() => setDeleteOpen(true)}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Move to Trash</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to move &ldquo;{prompt.title}&rdquo; to trash? You can
            restore it from the Trash page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(prompt.id)}
          >
            Move to Trash
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
