import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";
import { useResizable } from "@/hooks/useResizable";
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
  collapsed,
  onToggle,
}: VersionHistorySidebarProps) {
  const { width, onResizeStart, isResizing } = useResizable({
    initial: 256,
    min: 200,
    max: 480,
    side: "left",
  });
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

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
    } catch (e) {
      console.error("Failed to save version:", e);
    }
  };

  const handleDeleteVersion = async (id: number) => {
    try {
      await invoke("delete_prompt_version", { id });
      await loadVersions();
    } catch (e) {
      console.error("Failed to delete version:", e);
    }
  };

  const handleRestore = (version: PromptVersion) => {
    onRestore(version);
  };

  // Collapsed state: a slim icon-only bar mirroring the main sidebar's
  // collapsed mode. Clicking re-expands; the count badge stays visible.
  if (collapsed) {
    return (
      <div className="flex h-full w-14 shrink-0 flex-col items-center border-r bg-card py-3">
        <button
          onClick={onToggle}
          title="Expand versions"
          className="flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium leading-none">{versions.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full shrink-0 flex-col border-r bg-card", isResizing && "select-none")}
      style={{ width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">Versions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {versions.length}
          </span>
          <button
            onClick={onToggle}
            title="Collapse versions"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
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
          <Button
            size="sm"
            className="w-full"
            onClick={handleSaveVersion}
            disabled={!title.trim() || !content.trim()}
          >
            <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Save Version
          </Button>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg className="h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">
              {isEditing ? "No versions saved yet. Save your first version above." : "No version history available."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {versions.map((version) => (
              <div
                key={version.id}
                className={cn(
                  "group relative px-3 py-3 transition-colors hover:bg-muted/50",
                  expandedVersion === version.id && "bg-muted/30"
                )}
              >
                <button
                  onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      v{version.version_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(version.created_at)}
                    </span>
                  </div>
                  {version.message && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {version.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
                    {version.title}
                  </p>
                </button>

                {/* Expanded actions */}
                {expandedVersion === version.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs font-medium mb-1">Content Preview</p>
                      <p className="text-xs text-muted-foreground line-clamp-4 font-mono">
                        {version.content}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleRestore(version)}
                      >
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteVersion(version.id)}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Drag handle on the inner (right) edge — only while expanded. */}
      <ResizeHandle side="left" onMouseDown={onResizeStart} isActive={isResizing} />
    </div>
  );
}
