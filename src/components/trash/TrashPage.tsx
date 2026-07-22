import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, truncate } from "@/lib/utils";
import type { PromptRow } from "@/types";

interface TrashPageProps {
  onRefresh: () => void;
}

export function TrashPage({ onRefresh }: TrashPageProps) {
  const [trashedPrompts, setTrashedPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRow | null>(null);

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

  const handleEmptyTrash = async () => {
    if (trashedPrompts.length === 0) return;
    if (!confirm(`Permanently delete all ${trashedPrompts.length} trashed prompts? This cannot be undone.`)) return;
    try {
      await invoke("empty_trash");
      setTrashedPrompts([]);
      setSelectedPrompt(null);
    } catch (e) {
      console.error("Failed to empty trash:", e);
    }
  };

  const getDaysRemaining = (deletedAt: string | null): number | null => {
    if (!deletedAt) return null;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const daysInTrash = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysInTrash;
    return Math.max(0, daysRemaining);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading trash...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Trash</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {trashedPrompts.length === 0
              ? "Trash is empty"
              : `${trashedPrompts.length} item${trashedPrompts.length !== 1 ? "s" : ""} in trash`}
          </p>
        </div>
        {trashedPrompts.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Empty Trash
          </Button>
        )}
      </div>

      {trashedPrompts.length > 0 && (
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Items in trash will be permanently deleted after the retention period. You can restore them before then.
            </span>
          </div>
        </div>
      )}

      {trashedPrompts.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Title</span>
            <span className="w-32 text-center">Category</span>
            <span className="w-28 text-center">Days Left</span>
            <span className="w-24 text-right">Deleted</span>
          </div>
          <div className="divide-y">
            {trashedPrompts.map((prompt) => {
              const daysLeft = getDaysRemaining(prompt.deleted_at);
              return (
                <div
                  key={prompt.id}
                  className="group grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{prompt.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {truncate(prompt.description || prompt.content, 60)}
                      </p>
                    </div>
                  </div>
                  <div className="w-32 flex items-center justify-center">
                    {prompt.category && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {prompt.category}
                      </span>
                    )}
                  </div>
                  <div className="w-28 flex items-center justify-center">
                    <span className={`text-xs font-medium ${daysLeft !== null && daysLeft <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                      {daysLeft !== null ? `${daysLeft}d` : "-"}
                    </span>
                  </div>
                  <div className="w-24 text-right text-xs text-muted-foreground">
                    {prompt.deleted_at ? formatDate(prompt.deleted_at) : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Trash is empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">Deleted prompts will appear here until permanently removed</p>
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-card shadow-2xl border">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold truncate pr-4">{prompt.title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
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
