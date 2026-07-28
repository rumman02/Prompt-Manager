import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { PromptVersion } from "@/types";
import { Icon } from "@/components/ui/icon";
import { PanelStatusBar } from "@/components/prompts/PanelStatusBar";

interface VersionHistorySidebarProps {
  promptId: number | null;
  title: string;
  content: string;
  category: string;
  tags: string;
  description: string;
  onRestore: (version: PromptVersion) => void;
  isEditing: boolean;
}

export function VersionHistorySidebar({
  promptId,
  title,
  content,
  category,
  tags,
  description,
  onRestore,
  isEditing,
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      {/* Status bar — mirrors the Preview/Edit top bar so panels sitting
          side-by-side read as one system. */}
      <PanelStatusBar>
        <span className="font-medium">History</span>
        <span aria-hidden className="h-3 w-px bg-border" />
        <span>
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </span>
      </PanelStatusBar>

      {/* Save new version */}
        {isEditing && (
          <div className="border-b border-border p-3 space-y-2">
            <textarea
              value={saveMessage}
              onChange={(e) => setSaveMessage(e.target.value)}
              placeholder="Version message (optional)..."
              className="w-full resize-none rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={2}
            />
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors duration-150 hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={handleSaveVersion}
              disabled={!title.trim() || !content.trim()}
            >
              <Icon name="add" size="sm" />
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
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon name="history" size="md" />
              </div>
              <p className="text-caption leading-relaxed text-muted-foreground">
                {isEditing
                  ? "No versions yet. Save your first snapshot above, and every future change will be listed here for a one-click restore."
                  : "Versions appear here once you save this prompt and edit it again — each saved change becomes a snapshot you can restore with one click."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="group relative px-3 py-3 transition-colors duration-150 hover:bg-muted/50"
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
                        <span className="text-caption text-muted-foreground">
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
                            className="w-full rounded-sm border border-input bg-background px-1.5 py-0.5 text-xs shadow-macos-inset focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          <button
                            onClick={() => handleRename(version.id)}
                            title="Save label"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                          >
                            <Icon name="check" size="xs" />
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            title="Cancel"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                          >
                            <Icon name="close" size="xs" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {version.message && (
                            <p className="mt-0.5 text-caption text-muted-foreground truncate">
                              {version.message}
                            </p>
                          )}
                          <p className="text-caption text-muted-foreground/70 truncate">
                            {version.title}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Action toolbar — revealed on hover (group-hover) over the row */}
                    {renamingId !== version.id && (
                      <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border/60 bg-card/80 backdrop-blur-sm p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setViewing(version)}
                          title="View"
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon name="eye" size="sm" />
                        </button>
                        <button
                          onClick={() => handleRestore(version)}
                          title="Restore"
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon name="reset" size="sm" />
                        </button>
                        <button
                          onClick={() => startRename(version)}
                          title="Rename"
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon name="edit" size="sm" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(version.id)}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon name="delete" size="sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* ─── View modal (full version content, read-only) ─── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={() => setViewing(null)} />
          <div className="relative z-10 w-full max-w-xl bg-card/90 backdrop-blur-xl border-l border-border flex flex-col shadow-lg animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-headline truncate">
                  v{viewing.version_number}{viewing.message ? ` — ${viewing.message}` : ""}
                </h2>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Saved {formatDate(viewing.created_at)}
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                title="Close"
              >
                <Icon name="close" size="md" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                {viewing.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {viewing.category}
                  </span>
                )}
                {viewing.tags?.split(",").map((tag, i) => {
                  const trimmed = tag.trim();
                  if (!trimmed) return null;
                  return (
                    <span key={i} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {trimmed}
                    </span>
                  );
                })}
              </div>

              {viewing.description && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-body text-muted-foreground leading-relaxed">{viewing.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-subheadline font-medium">Title</span>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-body text-foreground">{viewing.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-subheadline font-medium">Prompt Content</span>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-code text-sm leading-relaxed text-foreground">
                    {viewing.content}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-sm border border-input px-4 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-muted"
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
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
              >
                <Icon name="reset" size="sm" />
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete confirmation ─── */}
      {pendingDeleteId != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPendingDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl p-6 shadow-lg border border-border">
            <h3 className="text-headline">Delete Version</h3>
            <p className="mt-2 text-body text-muted-foreground">
              Permanently delete this version? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-sm border border-input px-4 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVersion(pendingDeleteId)}
                className="rounded-sm bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground transition-colors duration-150 hover:bg-destructive/90"
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
