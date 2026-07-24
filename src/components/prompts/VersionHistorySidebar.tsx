import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";
import type { PromptVersion } from "@/types";

interface VersionHistorySidebarProps {
  promptId: number | null;
  title: string;
  content: string;
  category: string;
  tags: string;
  description: string;
  onRestore: (version: PromptVersion) => void;
  isEditing: boolean;
  /** When collapsed, the panel shrinks to a slim icon-only bar (like the main sidebar). */
  collapsed: boolean;
  onToggle: () => void;
  /** Shared resize state from the parent so width persists across panel swaps. */
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

/* ─── reusable 24×24 stroke icon paths (matches the rest of the app) ─── */
const ICON = {
  view: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  restore: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3",
  rename: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  trash: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  close: "M6 18L18 6M6 6l12 12",
  check: "M4.5 12.75l6 6 9-13.5",
  history: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  collapse: "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5",
};

export function VersionHistorySidebar({
  promptId,
  title,
  content,
  category,
  tags,
  description,
  onRestore,
  isEditing,
  collapsed,
  onToggle,
  width,
  onResizeStart,
  isResizing,
}: VersionHistorySidebarProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [viewing, setViewing] = useState<PromptVersion | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const loadVersions = async () => {
    if (!promptId) {
      setVersions([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await invoke<PromptVersion[]>("get_prompt_versions", { promptId });
      setVersions(result);
    } catch (e) {
      console.error("Failed to load versions:", e);
      toast.error("Failed to load version history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [promptId]);

  const handleSaveVersion = async () => {
    if (!promptId) return;
    try {
      await invoke("save_prompt_version", {
        promptId,
        title,
        content,
        category: category || null,
        tags: tags || null,
        description: description || null,
        message: saveMessage || null,
      });
      setSaveMessage("");
      await loadVersions();
      toast.success("Version saved");
    } catch (e) {
      console.error("Failed to save version:", e);
      toast.error("Failed to save version");
    }
  };

  const handleDeleteVersion = async (id: number) => {
    try {
      await invoke("delete_prompt_version", { id });
      await loadVersions();
      toast.success("Version deleted");
    } catch (e) {
      console.error("Failed to delete version:", e);
      toast.error("Failed to delete version");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleRename = async (id: number) => {
    const trimmed = renameDraft.trim() || null;
    try {
      const updated = await invoke<PromptVersion>("rename_prompt_version", {
        id,
        message: trimmed,
      });
      setVersions((prev) => prev.map((v) => (v.id === id ? updated : v)));
      toast.success(trimmed ? "Label updated" : "Label cleared");
    } catch (e) {
      console.error("Failed to rename version:", e);
      toast.error("Failed to rename version");
    } finally {
      setRenamingId(null);
    }
  };

  const startRename = (version: PromptVersion) => {
    setRenamingId(version.id);
    setRenameDraft(version.message ?? "");
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const handleRestore = (version: PromptVersion) => {
    onRestore(version);
    toast.success(`Restored v${version.version_number} to editor`);
  };

  // Collapsed state: a slim icon-only bar mirroring the main sidebar's
  // collapsed mode. Clicking re-expands; the count badge stays visible.
  if (collapsed) {
    return (
      <div className="flex h-full w-14 shrink-0 flex-col items-center border-l bg-card py-3">
        <button
          onClick={onToggle}
          title="Expand versions"
          className="flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.history} />
          </svg>
          <span className="text-[10px] font-medium leading-none">{versions.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full shrink-0 flex-row border-l bg-card", isResizing && "select-none")}
      style={{ width }}
    >
      {/* Drag handle on the inner (left) edge — full-height vertical strip. */}
      <ResizeHandle side="left" onMouseDown={onResizeStart} isActive={isResizing} />
      {/* Panel content column — min-w-0 so the handle keeps its strip. */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={ICON.history} />
            </svg>
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">History</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--secondary-foreground))]">
              {versions.length}
            </span>
            <button
              onClick={onToggle}
              title="Collapse history"
              className="flex h-6 w-6 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={ICON.collapse} />
              </svg>
            </button>
          </div>
        </div>

        {/* Save new version */}
        {isEditing && (
          <div className="border-b p-3 space-y-2">
            <textarea
              value={saveMessage}
              onChange={(e) => setSaveMessage(e.target.value)}
              placeholder="Version message (optional)..."
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={2}
            />
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--secondary-foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/70 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              onClick={handleSaveVersion}
              disabled={!title.trim() || !content.trim()}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Save Version
            </button>
          </div>
        )}

        {/* Version list */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-6 px-4 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {isEditing
                  ? "No versions yet. Save your first snapshot above, and every future change will be listed here for a one-click restore."
                  : "Versions appear here once you save this prompt and edit it again — each saved change becomes a snapshot you can restore with one click."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="group relative px-3 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
                >
                  {/* hover accent bar — makes entries easy to scan as the list grows */}
                  <span className="pointer-events-none absolute inset-y-2 left-0 w-[2px] rounded-r bg-[hsl(var(--accent-2-h)_var(--accent-2-s)_var(--accent-2-l))] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  {/* Header row — always visible */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[hsl(var(--accent-2-h)_var(--accent-2-s)_var(--accent-2-l))]">
                          v{version.version_number}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                      {renamingId === version.id ? (
                        <div className="mt-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={renameInputRef}
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(version.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            placeholder="Add a label..."
                            className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          <button
                            onClick={() => handleRename(version.id)}
                            title="Save label"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d={ICON.check} />
                            </svg>
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            title="Cancel"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d={ICON.close} />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          {version.message && (
                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                              {version.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 truncate">
                            {version.title}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Action toolbar — revealed on hover (group-hover) over the row */}
                    {renamingId !== version.id && (
                      <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/80 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setViewing(version)}
                          title="View"
                          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.view} />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRestore(version)}
                          title="Restore"
                          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.restore} />
                          </svg>
                        </button>
                        <button
                          onClick={() => startRename(version)}
                          title="Rename"
                          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.rename} />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(version.id)}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.trash} />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── View modal (full version content, read-only) ─── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewing(null)} />
          <div className="relative z-10 w-full max-w-xl bg-card shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold truncate">
                  v{viewing.version_number}{viewing.message ? ` — ${viewing.message}` : ""}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saved {formatDate(viewing.created_at)}
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON.close} />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                {viewing.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {viewing.category}
                  </span>
                )}
                {viewing.tags?.split(",").map((tag, i) => {
                  const trimmed = tag.trim();
                  if (!trimmed) return null;
                  return (
                    <span key={i} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                      {trimmed}
                    </span>
                  );
                })}
              </div>

              {viewing.description && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{viewing.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Title</span>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm text-foreground">{viewing.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Prompt Content</span>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                    {viewing.content}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-6 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-md border border-input px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const v = viewing;
                  setViewing(null);
                  handleRestore(v);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON.restore} />
                </svg>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete confirmation ─── */}
      {pendingDeleteId != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-card p-6 shadow-2xl border">
            <h3 className="text-lg font-semibold">Delete Version</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently delete this version? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-md border border-input px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVersion(pendingDeleteId)}
                className="rounded-md bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
