import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Icon, isIconName } from "@/components/ui/icon";
import { formatDate, getContentStats, truncate } from "@/lib/utils";
import { PromptActionsMenu, PromptMenuItems } from "./PromptActionsMenu";
import type { PromptRow } from "@/types";

interface PromptCardProps {
  prompt: PromptRow;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

/* macOS card: rounded-xl (14px), subtle border + shadow, accent tint on hover.
   Left-click opens the prompt; right-click opens the shared actions ContextMenu. */
export function PromptCard({
  prompt,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: PromptCardProps) {
  const stats = getContentStats(prompt.content);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            className="group cursor-pointer shadow-sm transition-shadow hover:shadow-md"
            onClick={() => onSelect(prompt)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                    aria-hidden="true"
                  >
                    <Icon
                      name={isIconName(prompt.icon) ? prompt.icon : "file"}
                      size="md"
                      className="text-primary"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <CardTitle className="min-w-0 text-base font-semibold transition-colors group-hover:text-primary">
                      {prompt.title}
                    </CardTitle>
                    {prompt.category && (
                      <Badge className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary hover:bg-primary/10">
                        {prompt.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <PromptActionsMenu
                  prompt={prompt}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onToggleFavorite={onToggleFavorite}
                  onDeleteRequest={() => setDeleteOpen(true)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {truncate(prompt.description || prompt.content, 120)}
              </p>
              {prompt.tags && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {prompt.tags.split(",").map((tag, i) => {
                    const trimmed = tag.trim();
                    if (!trimmed) return null;
                    return (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 font-normal"
                      >
                        {trimmed}
                      </Badge>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDate(prompt.updated_at)}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/80">
                <span>~{stats.tokens} tokens</span>
                <span>{stats.words} words</span>
                <span>{stats.sentences} sentences</span>
                <span>{stats.paragraphs} paragraphs</span>
              </div>
            </CardContent>
          </Card>
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
