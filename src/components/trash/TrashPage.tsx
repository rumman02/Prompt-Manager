import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate, truncate } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
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
        <div className="text-caption text-muted-foreground">Loading trash...</div>
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="alert" size="md" className="text-destructive mt-0.5" />
              <span className="text-subheadline text-destructive">{emptyTrashError}</span>
            </div>
            <button
              onClick={() => setEmptyTrashError(null)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-destructive/70 hover:bg-destructive/20 transition-colors"
              aria-label="Dismiss error"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        </div>
      )}

      {trashedPrompts.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="info" size="md" className="text-warning" />
            <span className="text-subheadline text-warning">
              Items in trash will be permanently deleted after the retention period. You can restore them before then.
            </span>
          </div>
        </div>
      )}

      {trashedPrompts.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-md overflow-hidden grid grid-cols-[1fr_8rem_7rem_6rem_auto] gap-x-4 auto-rows-auto">
          <div className="grid col-span-5 grid-cols-subgrid border-b bg-muted/30 px-4 py-3 text-eyebrow text-muted-foreground">
            <span>Title</span>
            <span className="text-center">Category</span>
            <span className="text-center">Days Left</span>
            <span className="text-right">Deleted</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="grid col-span-5 grid-cols-subgrid divide-y contents">
            {trashedPrompts.map((prompt) => {
              const daysLeft = getDaysRemaining(prompt.deleted_at);
              const isUrgent = daysLeft !== null && daysLeft <= 3;
              return (
                <div
                  key={prompt.id}
                  className="group grid col-span-5 grid-cols-subgrid gap-x-4 items-start px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                      <Icon name="file" size="md" className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-subheadline font-medium truncate">{prompt.title}</p>
                      <p className="text-caption text-muted-foreground truncate">
                        {truncate(prompt.description || prompt.content, 60)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    {prompt.category ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
                        {prompt.category}
                      </span>
                    ) : (
                      <span className="text-caption text-muted-foreground/50">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {daysLeft !== null ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                        {daysLeft}d left
                      </span>
                    ) : (
                      <span className="text-caption text-muted-foreground/50">—</span>
                    )}
                  </div>
                  <span className="text-right text-caption text-muted-foreground">
                    {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}
                  </span>

                  {/* per-row actions — flush-right, fades in on hover */}
                  <div className="flex items-start justify-end">
                    <TrashRowActions
                      onRestore={() => handleRestore(prompt.id)}
                      onDelete={() => handlePermanentDelete(prompt.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Icon name="trash" size="xl" className="text-muted-foreground" />
            </div>
            <h3 className="text-headline font-medium">Trash is empty</h3>
            <p className="mt-1 max-w-sm text-caption text-muted-foreground">Deleted prompts will appear here until permanently removed</p>
          </CardContent>
        </Card>
      )}

      {selectedPrompt && (
        <TrashDetailModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      )}

      {showEmptyConfirm && (
        <Modal open={true} onClose={() => setShowEmptyConfirm(false)} title="Empty Trash" footer={
          <>
            <Button variant="outline" onClick={() => setShowEmptyConfirm(false)} disabled={emptyTrashBusy}>Cancel</Button>
            <Button variant="destructive" onClick={confirmEmptyTrash} disabled={emptyTrashBusy} className="gap-2">
              {emptyTrashBusy ? "Emptying…" : "Empty Trash"}
            </Button>
          </>
        }>
          <p className="text-subheadline text-muted-foreground">
            Permanently delete all {trashedPrompts.length} trashed prompt{trashedPrompts.length !== 1 ? "s" : ""}? This cannot be undone.
          </p>
        </Modal>
      )}
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
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setAnchor(null);
  }, []);

  /* close on outside click or Escape */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    /* rAF so the opening click doesn't immediately close it */
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      closeMenu();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchor({ x: rect.right, y: rect.bottom });
      setOpen(true);
    }
  };

  const stop: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /* menu positioning: prefer right-aligned under the trigger, flip if it overflows */
  const menuStyle = ((): React.CSSProperties => {
    if (!anchor) return {};
    const W = 176; // 11rem
    const H = 104; // approx menu height (2 items + divider + padding)
    let left = anchor.x - W; // right-align to trigger
    let top = anchor.y + 4;
    // clamp horizontally
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    // flip up if overflowing bottom of viewport
    if (top + H > window.innerHeight - 8) top = anchor.y - H - 4;
    return { position: "fixed", left, top, zIndex: 100, minWidth: W };
  })();

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
        title="Actions"
      >
        <Icon name="more" size="md" />
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            onMouseDown={stop}
            className="rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <button
              onClick={(e) => {
                stop(e);
                closeMenu();
                onRestore();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-subheadline hover:bg-muted focus:bg-muted transition-colors"
            >
              <Icon name="reset" size="sm" className="shrink-0" />
              Restore
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={(e) => {
                stop(e);
                closeMenu();
                onDelete();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-subheadline text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
            >
              <Icon name="delete" size="sm" className="shrink-0" />
              Delete Permanently
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function TrashDetailModal({
  prompt,
  onClose,
  onRestore,
  onPermanentDelete,
}: {
  prompt: PromptRow;
  onClose: () => void;
  onRestore: (id: number) => void;
  onPermanentDelete: (id: number) => void;
}) {
  return (
    <Modal open={true} onClose={onClose} title={prompt.title} footer={
      <>
        <Button variant="outline" onClick={() => onPermanentDelete(prompt.id)} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
          Delete Permanently
        </Button>
        <Button onClick={() => onRestore(prompt.id)} className="gap-2">Restore</Button>
      </>
    }>
      {prompt.category && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {prompt.category}
          </span>
        </div>
      )}
      {prompt.description && (
        <p className="text-subheadline text-muted-foreground">{prompt.description}</p>
      )}
      <div className="rounded-lg border bg-muted/30 p-4 max-h-48 overflow-auto">
        <pre className="whitespace-pre-wrap font-mono text-caption leading-relaxed text-foreground">
          {prompt.content}
        </pre>
      </div>
      <div className="flex items-center gap-4 text-caption text-muted-foreground">
        <span>Created: {formatDate(prompt.created_at)}</span>
        <span>Deleted: {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}</span>
      </div>
    </Modal>
  );
}
