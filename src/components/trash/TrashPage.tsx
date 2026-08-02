import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate, truncate } from "@/lib/utils";
import { Icon, isIconName } from "@/components/ui/icon";
import type { PromptRow } from "@/types";

interface TrashPageProps {
  onRefresh: () => void;
}

export function TrashPage({ onRefresh }: TrashPageProps) {
  const [trashedPrompts, setTrashedPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRow | null>(null);
  const [emptyTrashBusy, setEmptyTrashBusy] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyTrashError, setEmptyTrashError] = useState<string | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<number | null>(null);

  const loadTrashedPrompts = async () => {
    try {
      const result = await invoke<PromptRow[]>("get_trashed_prompts");
      setTrashedPrompts(result);
    } catch (e) {
      console.error("Failed to load trashed prompts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashedPrompts();
  }, []);

  const handleRestore = async (id: number) => {
    try {
      await invoke("restore_prompt", { id });
      await loadTrashedPrompts();
      onRefresh();
    } catch (e) {
      console.error("Failed to restore prompt:", e);
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await invoke("permanently_delete_prompt", { id });
      if (selectedPrompt?.id === id) setSelectedPrompt(null);
      await loadTrashedPrompts();
    } catch (e) {
      console.error("Failed to permanently delete prompt:", e);
    }
  };

  const handleEmptyTrash = () => {
    if (trashedPrompts.length === 0) return;
    setEmptyTrashError(null);
    setShowEmptyConfirm(true);
  };

  const confirmEmptyTrash = async () => {
    setShowEmptyConfirm(false);
    setEmptyTrashBusy(true);
    try {
      await invoke("empty_trash");
      await loadTrashedPrompts();
      onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[EmptyTrash] failed:", e);
      setEmptyTrashError(`Failed to empty trash: ${msg}`);
    } finally {
      setEmptyTrashBusy(false);
    }
  };

  const getDaysRemaining = (deletedAt: string | null): number | null => {
    if (!deletedAt) return null;
    const deleted = new Date(deletedAt.endsWith("Z") || deletedAt.includes("T") ? deletedAt : deletedAt + "Z");
    const now = new Date();
    const daysInTrash = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysInTrash;
    return Math.max(0, daysRemaining);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="trash"
        title="Trash"
        subtitle={
          trashedPrompts.length === 0
            ? "Trash is empty"
            : `${trashedPrompts.length} item${trashedPrompts.length !== 1 ? "s" : ""} in trash`
        }
        actions={
          trashedPrompts.length > 0 ? (
            <Button variant="destructive" onClick={handleEmptyTrash} disabled={emptyTrashBusy} className="gap-2">
              <Icon name="delete" size="sm" />
              {emptyTrashBusy ? "Emptying…" : "Empty Trash"}
            </Button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">

      {emptyTrashError && (
        <Alert variant="destructive" className="bg-destructive/10">
          <Icon name="alert" size="md" className="text-destructive" />
          <AlertTitle className="flex items-center justify-between gap-3">
            <span>{emptyTrashError}</span>
            <button
              onClick={() => setEmptyTrashError(null)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-destructive/70 hover:bg-destructive/20 transition-colors"
              aria-label="Dismiss error"
            >
              <Icon name="close" size="sm" />
            </button>
          </AlertTitle>
        </Alert>
      )}

      {trashedPrompts.length > 0 && (
        <Alert className="bg-warning/10">
          <Icon name="info" size="md" className="text-warning" />
          <AlertTitle className="text-warning">
            Items in trash will be permanently deleted after the retention period. You can restore them before then.
          </AlertTitle>
        </Alert>
      )}

      {trashedPrompts.length > 0 ? (
        <Card className="overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Title</TableHead>
                <TableHead className="w-32 text-center">Category</TableHead>
                <TableHead className="w-28 text-center">Days Left</TableHead>
                <TableHead className="w-24 text-right">Deleted</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trashedPrompts.map((prompt) => {
                const daysLeft = getDaysRemaining(prompt.deleted_at);
                const isUrgent = daysLeft !== null && daysLeft <= 3;
                return (
                  <TableRow
                    key={prompt.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Icon name={isIconName(prompt.icon) ? prompt.icon : "file"} size="md" className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{prompt.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {truncate(prompt.description || prompt.content, 60)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-32 text-center">
                      {prompt.category ? (
                        <Badge className="rounded-full border-transparent bg-primary/10 px-2.5 py-0.5 font-medium text-primary whitespace-nowrap">
                          {prompt.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-28 text-center">
                      {daysLeft !== null ? (
                        <Badge
                          className={`rounded-full px-2 py-0.5 font-medium whitespace-nowrap ${
                            isUrgent
                              ? "border-transparent bg-destructive/10 text-destructive"
                              : "border-transparent bg-muted text-muted-foreground"
                          }`}
                        >
                          {daysLeft}d left
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-24 text-right text-xs text-muted-foreground">
                      {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}
                    </TableCell>

                    {/* per-row actions — flush-right, fades in on hover */}
                    <TableCell className="w-16 text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <TrashRowActions
                          onRestore={() => handleRestore(prompt.id)}
                          onDelete={() => setPromptToDelete(prompt.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Icon name="trash" size="xl" className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Trash is empty</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Deleted prompts will appear here until permanently removed</p>
          </CardContent>
        </Card>
      )}

      {selectedPrompt && (
        <TrashDetailModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onRestore={handleRestore}
          onDelete={(id) => {
            setSelectedPrompt(null);
            setPromptToDelete(id);
          }}
        />
      )}

      <AlertDialog
        open={promptToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPromptToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prompt permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This prompt will be permanently deleted from the trash and cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (promptToDelete !== null) handlePermanentDelete(promptToDelete);
              }}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showEmptyConfirm}
        onOpenChange={(open) => {
          if (!open) setShowEmptyConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete all {trashedPrompts.length} trashed prompt{trashedPrompts.length !== 1 ? "s" : ""}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={emptyTrashBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={emptyTrashBusy}
              onClick={confirmEmptyTrash}
            >
              {emptyTrashBusy ? "Emptying…" : "Empty Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

/* ─── per-row ⋯ actions menu (restore / delete permanently) ─── */

function TrashRowActions({
  onRestore,
  onDelete,
}: {
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Actions"
          aria-label="Actions"
          className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100"
        >
          <Icon name="more" size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onRestore}>
          <Icon name="reset" size="sm" />
          Restore
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Icon name="delete" size="sm" />
          Delete Permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TrashDetailModal({
  prompt,
  onClose,
  onRestore,
  onDelete,
}: {
  prompt: PromptRow;
  onClose: () => void;
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{prompt.title}</DialogTitle>
        </DialogHeader>
        {prompt.category && (
          <div className="flex items-center gap-2">
            <Badge className="rounded-full border-transparent bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
              {prompt.category}
            </Badge>
          </div>
        )}
        {prompt.description && (
          <p className="text-sm text-muted-foreground">{prompt.description}</p>
        )}
        <div className="rounded-lg border bg-muted/30 p-4 max-h-48 overflow-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
            {prompt.content}
          </pre>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Created: {formatDate(prompt.created_at)}</span>
          <span>Deleted: {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDelete(prompt.id)} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Icon name="delete" size="sm" />
            Delete Permanently
          </Button>
          <Button onClick={() => onRestore(prompt.id)} className="gap-2">
            <Icon name="reset" size="sm" />
            Restore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
