import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { formatDate, VARIABLE_TOKEN_RE } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { renderCompiledMarkdown, type RenderedMarkdown } from "@/lib/markdown";
import { usePrompts } from "@/hooks/usePrompts";
import { useResizable } from "@/hooks/useResizable";
import type { PromptRow, VariableSet } from "@/types";

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
  // false = rendered Markdown preview, true = raw compiled Markdown source.
  const [showRaw, setShowRaw] = useState(false);

  // Bumped on every variable-set switch. Used as a React key so the preview
  // subtree remounts, which restarts the CSS flash animation (re-adding a
  // class alone would not retrigger it).
  const [flashKey, setFlashKey] = useState(0);

  // Stable bounds so the panel starts at 60% width, with the resize caps
  // computed once per mount instead of every render.
  const [bounds] = useState(() => ({
    initial: Math.round(window.innerWidth * 0.6),
    min: 576,
    max: Math.round(window.innerWidth * 0.8),
  }));
  const { width, onResizeStart, isResizing } = useResizable({
    initial: bounds.initial,
    min: bounds.min,
    max: bounds.max,
    side: "right",
  });

  const { getPromptVariables, listVariableSets, setActiveVariableSet } = usePrompts();

  // The viewed prompt's variable sets + the active set's saved values, hydrated
  // whenever the prompt changes. get_prompt_variables filters by the active set,
  // so the values are read after the sets (sequentially) below.
  const [variableSets, setVariableSets] = useState<VariableSet[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [activeSetId, setActiveSetId] = useState<number | null>(null);

  useEffect(() => {
    if (!prompt) {
      setVariableSets([]);
      setVariableValues({});
      setActiveSetId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sets = await listVariableSets(prompt.id);
        if (cancelled) return;
        setVariableSets(sets);
        const active = sets.find((s) => s.isActive) ?? sets[0];
        setActiveSetId(active?.id ?? null);
        const values = await getPromptVariables(prompt.id);
        if (!cancelled) setVariableValues(values);
      } catch (e) {
        console.error("Failed to load variable values:", e);
        if (!cancelled) {
          setVariableSets([]);
          setVariableValues({});
          setActiveSetId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prompt, listVariableSets, getPromptVariables]);

  // One compile pass yields the raw compiled text (for clipboard/raw view), the
  // sanitized + variable-highlighted HTML (for rendering), and the unfilled
  // list (for the counter / helper text). Shares renderCompiledMarkdown with
  // the editor's PreviewPanel — no second compiler.
  const { text, html, unfilled }: RenderedMarkdown = useMemo(
    () => renderCompiledMarkdown(prompt?.content ?? "", variableValues),
    [prompt?.content, variableValues],
  );

  // A prompt with no {{placeholders}} doesn't need a set switcher — hide it.
  // Reuses the shared VARIABLE_TOKEN_RE (.match resets lastIndex, so this is
  // safe on the shared global regex).
  const hasVariables = useMemo(
    () => (prompt?.content.match(VARIABLE_TOKEN_RE)?.length ?? 0) > 0,
    [prompt?.content],
  );

  // Switch the active set in the backend, then re-read its values so the
  // compiled output re-renders with the new set's data.
  const handleSelectSet = useCallback(
    async (setId: number) => {
      if (!prompt) return;
      try {
        await setActiveVariableSet(prompt.id, setId);
        setActiveSetId(setId);
        setVariableSets((prev) => prev.map((s) => ({ ...s, isActive: s.id === setId })));
        setVariableValues(await getPromptVariables(prompt.id));
        setFlashKey((n) => n + 1);
      } catch (e) {
        console.error("Failed to switch variable set:", e);
      }
    },
    [prompt, setActiveVariableSet, getPromptVariables],
  );

  if (!prompt) return null;

  const handleCopy = async () => {
    // Copy the COMPILED text (variables substituted), not the raw source.
    const wrote = await copyToClipboard(text);
    if (!wrote) {
      toast.error("Couldn't copy to clipboard");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);

    // Non-blocking heads-up: copy succeeded, but if anything is unfilled the
    // user should know the {{placeholders}} made it onto their clipboard.
    if (unfilled.length > 0) {
      toast(
        unfilled.length === 1
          ? "Copied with 1 unfilled variable"
          : `Copied with ${unfilled.length} unfilled variables`,
      );
    } else {
      toast.success("Copied to clipboard");
    }
  };

  const handleDelete = () => {
    onDelete(prompt.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />
      <div
        style={{ width, minWidth: 576, maxWidth: "80vw" }}
        className="relative z-10 bg-card/90 backdrop-blur-xl border-l border-border flex flex-col shadow-lg animate-in slide-in-from-right duration-300"
      >
        <div
          onMouseDown={onResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          className={`absolute left-0 top-0 bottom-0 z-20 w-1.5 cursor-col-resize transition-colors hover:bg-primary/30 active:bg-primary/40 ${isResizing ? "bg-primary/30" : ""}`}
        />
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-subheadline font-medium">Prompt Content</span>
              <div className="flex items-center gap-1.5">
                {/* Set switcher — only when there's at least one set AND the
                    prompt actually uses variables, otherwise it's pure noise. */}
                {hasVariables && variableSets.length > 0 && (
                  <div className="w-44 min-w-0">
                    <Dropdown
                      value={activeSetId !== null ? String(activeSetId) : ""}
                      onChange={(v) => {
                        const num = Number(v);
                        if (num) handleSelectSet(num);
                      }}
                      className="h-7 text-xs"
                      options={variableSets.map((s) => ({
                        value: String(s.id),
                        label: `${s.name}${s.isActive ? " · active" : ""}`,
                      }))}
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRaw((v) => !v)}
                  className="h-7 text-xs gap-1.5"
                  aria-pressed={showRaw}
                  aria-label={showRaw ? "Show formatted preview" : "Show raw compiled Markdown"}
                >
                  {showRaw ? "Formatted" : "Raw"}
                </Button>
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
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              {showRaw ? (
                <pre className="whitespace-pre-wrap font-code text-sm leading-relaxed text-foreground">
                  {text}
                </pre>
              ) : (
                <div
                  key={`vars-${flashKey}`}
                  className={`markdown-preview ${flashKey > 0 ? "vars-flash" : ""}`}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </div>
            {/* Same wording as PreviewPanel: unfilled placeholders copy as-is. */}
            {unfilled.length > 0 && (
              <p className="text-caption text-muted-foreground">
                {unfilled.length === 1
                  ? "1 variable is unfilled — its {{placeholder}} will be copied as-is."
                  : `${unfilled.length} variables are unfilled — their {{placeholders}} will be copied as-is.`}
              </p>
            )}
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
