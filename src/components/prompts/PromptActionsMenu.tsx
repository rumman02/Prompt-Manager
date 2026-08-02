import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenuItem,
  ContextMenuSeparator,
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
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { PromptRow } from "@/types";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";

export interface PromptActionsMenuProps {
  prompt: PromptRow;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  /** className for the trigger button (controls hover visibility, sizing). */
  className?: string;
  /** Alignment of the dropdown relative to the trigger button. */
  align?: "start" | "center" | "end";
  /**
   * When provided, the Delete item surfaces the parent-owned AlertDialog
   * instead of this component's built-in one — lets a row/card share ONE
   * confirmation dialog between its 3-dot dropdown and its context menu.
   */
  onDeleteRequest?: () => void;
}

// Kept for backwards compatibility with the old imperative handle API (index.ts
// re-exports it). The row/card context menus now use shadcn's ContextMenu, so
// nothing needs the imperative handle anymore.
export interface PromptActionsMenuHandle {
  openContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Shared action items for a prompt row/card. Rendered inside either a
 * DropdownMenu (3-dot trigger) or a ContextMenu (right-click on the row) — both
 * surfaces show identical actions: Copy / Edit / Duplicate / Favorite / Delete.
 * The destructive Delete item surfaces a confirmation AlertDialog.
 */
export function PromptMenuItems({
  menu,
  prompt,
  onEdit,
  onDeleteRequest,
  onDuplicate,
  onToggleFavorite,
}: {
  menu: "dropdown" | "context";
  prompt: PromptRow;
  onEdit: (prompt: PromptRow) => void;
  onDeleteRequest: () => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}) {
  const Item = menu === "context" ? ContextMenuItem : DropdownMenuItem;
  const Separator = menu === "context" ? ContextMenuSeparator : DropdownMenuSeparator;

  const handleCopy = useCallback(async () => {
    const wrote = await copyToClipboard(prompt.content);
    if (wrote) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Couldn't copy to clipboard");
    }
  }, [prompt.content]);

  return (
    <>
      <Item onClick={handleCopy} className="gap-2.5">
        <Icon name="clipboard" size="sm" />
        Copy
      </Item>
      <Item onClick={() => onEdit(prompt)} className="gap-2.5">
        <Icon name="edit" size="sm" />
        Edit
      </Item>
      <Item onClick={() => onDuplicate(prompt.id)} className="gap-2.5">
        <Icon name="copy" size="sm" />
        Duplicate
      </Item>
      {onToggleFavorite && (
        <Item
          onClick={() => onToggleFavorite(prompt.id)}
          className="gap-2.5"
        >
          <Icon
            name="star"
            size="sm"
            fill={prompt.is_favorite ? "currentColor" : "none"}
          />
          {prompt.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
        </Item>
      )}
      <Separator />
      <Item
        onClick={onDeleteRequest}
        className="gap-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
      >
        <Icon name="delete" size="sm" />
        Delete
      </Item>
    </>
  );
}

/**
 * The 3-dot actions menu for a prompt row/card. Owns its own delete-confirmation
 * AlertDialog so the trigger button stays tiny and self-contained.
 */
export function PromptActionsMenu({
  prompt,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  className,
  align = "end",
  onDeleteRequest,
}: PromptActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const requestDelete = onDeleteRequest ?? (() => setDeleteOpen(true));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More options"
            title="More options"
            className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", className)}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="more" size="md" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[11rem]">
          <PromptMenuItems
            menu="dropdown"
            prompt={prompt}
            onEdit={onEdit}
            onDeleteRequest={requestDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {!onDeleteRequest && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
      )}
    </>
  );
}
