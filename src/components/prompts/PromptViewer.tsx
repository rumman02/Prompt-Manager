import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import type { PromptRow } from "@/types";

interface PromptViewerProps {
  prompt: PromptRow | null;
  onClose: () => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptViewer({ prompt, onClose, onEdit, onDelete, onToggleFavorite }: PromptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!prompt) return null;

  const handleCopy = async () => {
    const wrote = await copyToClipboard(prompt.content);
    if (!wrote) {
      toast.error("Couldn't copy to clipboard");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    onDelete(prompt.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-card/90 backdrop-blur-xl border-l border-border flex flex-col shadow-lg animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-headline truncate">{prompt.title}</h2>
            <p className="text-caption text-muted-foreground mt-0.5">
              Updated {formatDate(prompt.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(prompt.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${prompt.is_favorite ? 'text-yellow-500' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Icon name="star" size="md" fill={prompt.is_favorite ? "currentColor" : "none"} />
              </button>
            )}
            <button
              onClick={() => onEdit(prompt)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
              title="Edit"
            >
              <Icon name="edit" size="md" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
              title="Delete"
            >
              <Icon name="delete" size="md" />
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
              title="Close"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            {prompt.category && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Icon name="categories" size="xs" className="mr-1.5" />
                {prompt.category}
              </span>
            )}
            {prompt.tags &&
              prompt.tags.split(",").map((tag, i) => {
                const trimmed = tag.trim();
                if (!trimmed) return null;
                return (
                  <span key={i} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    <Icon name="tags" size="xs" className="mr-1.5" />
                    {trimmed}
                  </span>
                );
              })}
          </div>

          {prompt.description && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-body text-muted-foreground leading-relaxed">{prompt.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-subheadline font-medium">Prompt Content</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <Icon name="check" size="sm" className="text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon name="clipboard" size="sm" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-code text-sm leading-relaxed text-foreground">
                {prompt.content}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-4 text-caption text-muted-foreground pt-3 border-t border-border">
            <span>Created: {formatDate(prompt.created_at)}</span>
            <span>Updated: {formatDate(prompt.updated_at)}</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl p-6 shadow-lg border border-border">
            <h3 className="text-headline">Move to Trash</h3>
            <p className="mt-2 text-body text-muted-foreground">
              Are you sure you want to move &ldquo;{prompt.title}&rdquo; to trash? You can restore it from the Trash page.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Move to Trash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
