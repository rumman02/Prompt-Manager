import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { PromptVersion } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
        <Separator orientation="vertical" className="h-3" />
        <span>
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </span>
      </PanelStatusBar>

      {/* Save new version */}
      {isEditing && (
        <div className="space-y-2 p-3 pb-4">
          <Textarea
            value={saveMessage}
            onChange={(e) => setSaveMessage(e.target.value)}
            placeholder="Version message (optional)..."
            className="min-h-[60px] resize-none text-sm"
            rows={2}
          />
          <Button
            type="button"
            className="w-full gap-1.5"
            onClick={handleSaveVersion}
            disabled={!title.trim() || !content.trim()}
          >
            <Icon name="add" size="sm" />
            Save Version
          </Button>
        </div>
      )}

      {/* Version list */}
      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-4 py-6 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon name="history" size="md" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isEditing
                ? "No versions yet. Save your first snapshot above, and every future change will be listed here for a one-click restore."
                : "Versions appear here once you save this prompt and edit it again — each saved change becomes a snapshot you can restore with one click."}
            </p>
          </div>
        ) : (
          <div>
            {versions.map((version) => (
              <div
                key={version.id}
                className="group relative border-l-2 border-transparent px-3 py-3 transition-colors duration-150 hover:border-primary hover:bg-muted/50"
              >
                {/* Header row — always visible */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        v{version.version_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(version.created_at)}
                      </span>
                    </div>
                    {renamingId === version.id ? (
                      <div className="mt-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          ref={renameInputRef}
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(version.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          placeholder="Add a label..."
                          className="h-7 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRename(version.id)}
                          title="Save label"
                        >
                          <Icon name="check" size="xs" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setRenamingId(null)}
                          title="Cancel"
                        >
                          <Icon name="close" size="xs" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {version.message && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {version.message}
                          </p>
                        )}
                        <p className="truncate text-xs text-muted-foreground/70">
                          {version.title}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Action toolbar — revealed on hover (group-hover) over the row */}
                  {renamingId !== version.id && (
                    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border/60 bg-card/80 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 rounded p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewing(version)}
                        title="View"
                      >
                        <Icon name="eye" size="sm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 rounded p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleRestore(version)}
                        title="Restore"
                      >
                        <Icon name="reset" size="sm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 rounded p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => startRename(version)}
                        title="Rename"
                      >
                        <Icon name="edit" size="sm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 rounded p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDeleteId(version.id)}
                        title="Delete"
                      >
                        <Icon name="delete" size="sm" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* ─── View modal (full version content, read-only) ─── */}
      <Sheet
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <SheetContent side="right" className="flex w-full max-w-xl flex-col p-0">
          {viewing && (
            <>
              <SheetHeader className="border-b border-border/50 px-6 py-4 text-left">
                <SheetTitle className="truncate text-lg">
                  v{viewing.version_number}
                  {viewing.message ? ` — ${viewing.message}` : ""}
                </SheetTitle>
                <SheetDescription>
                  Saved {formatDate(viewing.created_at)}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-5 p-6">
                  <div className="flex flex-wrap gap-2">
                    {viewing.category && (
                      <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary hover:bg-primary/10">
                        {viewing.category}
                      </Badge>
                    )}
                    {viewing.tags?.split(",").map((tag, i) => {
                      const trimmed = tag.trim();
                      if (!trimmed) return null;
                      return (
                        <Badge key={i} variant="secondary" className="rounded-full px-2.5 py-0.5 font-normal">
                          {trimmed}
                        </Badge>
                      );
                    })}
                  </div>

                  {viewing.description && (
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="select-text text-sm leading-relaxed text-muted-foreground">{viewing.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Title</span>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="select-text text-sm text-foreground">{viewing.title}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Prompt Content</span>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <pre className="select-text whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                        {viewing.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="border-t border-border/50 px-6 py-3">
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const v = viewing;
                    setViewing(null);
                    handleRestore(v);
                  }}
                  className="gap-1.5"
                >
                  <Icon name="reset" size="sm" />
                  Restore
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Delete confirmation ─── */}
      <AlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this version? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDeleteId != null && handleDeleteVersion(pendingDeleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
