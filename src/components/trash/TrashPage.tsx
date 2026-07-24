import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate, truncate } from "@/lib/utils";
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
    // Open a real confirmation modal instead of window.confirm().
    //
    // window.confirm() is *not implemented* in Tauri v2's Wry webview: it
    // returns undefined (it does not throw), so the old code's `ok` was always
    // undefined and `if (!ok) return` always bailed out — making the button
    // silently do nothing. The app already uses a custom confirm modal pattern
    // (see PromptViewer's showDeleteConfirm), so we reuse that here.
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
    // Stored as naive UTC (see formatDate); parse as UTC so the day count isn't
    // skewed by the user's local offset.
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
        icon={
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        }
        title="Trash"
        subtitle={
          trashedPrompts.length === 0
            ? "Trash is empty"
            : `${trashedPrompts.length} item${trashedPrompts.length !== 1 ? "s" : ""} in trash`
        }
        actions={
          trashedPrompts.length > 0 ? (
            <Button variant="destructive" onClick={handleEmptyTrash} disabled={emptyTrashBusy} className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {emptyTrashBusy ? "Emptying…" : "Empty Trash"}
            </Button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">

      {emptyTrashError && (
        <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-destructive mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-subheadline text-destructive">{emptyTrashError}</span>
            </div>
            <button
              onClick={() => setEmptyTrashError(null)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-destructive/70 hover:bg-destructive/20 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {trashedPrompts.length > 0 && (
        <div className="rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-subheadline text-warning">
              Items in trash will be permanently deleted after the retention period. You can restore them before then.
            </span>
          </div>
        </div>
      )}

      {trashedPrompts.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-macos-window overflow-hidden grid grid-cols-[1fr_8rem_7rem_6rem_auto] gap-x-4 auto-rows-auto">
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
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEmptyConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card/95 p-6 shadow-macos-popover border backdrop-blur-xl">
            <h3 className="text-headline font-semibold">Empty Trash</h3>
            <p className="mt-2 text-subheadline text-muted-foreground">
              Permanently delete all {trashedPrompts.length} trashed prompt
              {trashedPrompts.length !== 1 ? "s" : ""}? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEmptyConfirm(false)} disabled={emptyTrashBusy}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmEmptyTrash} disabled={emptyTrashBusy} className="gap-2">
                {emptyTrashBusy ? "Emptying…" : "Empty Trash"}
              </Button>
            </div>
          </div>
        </div>
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
        title="Actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            onMouseDown={stop}
            className="rounded-[10px] border bg-popover p-1 text-popover-foreground shadow-macos-popover"
          >
            <button
              onClick={(e) => {
                stop(e);
                closeMenu();
                onRestore();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-subheadline hover:bg-muted focus:bg-muted transition-colors"
            >
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
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
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-card/95 shadow-macos-popover border backdrop-blur-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-headline font-semibold truncate pr-4">{prompt.title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
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
          <div className="rounded-[10px] border bg-muted/30 p-4 max-h-48 overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-caption leading-relaxed text-foreground">
              {prompt.content}
            </pre>
          </div>
          <div className="flex items-center gap-4 text-caption text-muted-foreground">
            <span>Created: {formatDate(prompt.created_at)}</span>
            <span>Deleted: {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onPermanentDelete(prompt.id)}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete Permanently
          </Button>
          <Button onClick={() => onRestore(prompt.id)} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Restore
          </Button>
        </div>
      </div>
    </div>
  );
}
