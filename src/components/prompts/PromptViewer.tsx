import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { formatDate, VARIABLE_TOKEN_RE } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { renderCompiledMarkdown, type RenderedMarkdown } from "@/lib/markdown";
import { usePrompts } from "@/hooks/usePrompts";
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
  // "preview" = rendered Markdown preview, "raw" = raw compiled Markdown source.
  const [view, setView] = useState<"preview" | "raw">("preview");

  // Bumped on every variable-set switch. Used as a React key so the preview
  // subtree remounts, which restarts the flash animation (re-adding a class
  // alone would not retrigger it).
  const [flashKey, setFlashKey] = useState(0);

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
    <div className="fixed inset-0 z-50">
      {/* Backdrop — click anywhere on the dimmed area (the left spacer panel)
          closes the viewer. */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />
      <ResizablePanelGroup orientation="horizontal" className="absolute inset-0">
        <ResizablePanel
          id="spacer"
          defaultSize="40"
          minSize="15"
          className="relative z-10"
          onClick={onClose}
        />
        <ResizableHandle withHandle className="relative z-20" />
        <ResizablePanel
          id="viewer"
          defaultSize="60"
          minSize="35"
          maxSize="85"
          className="relative z-10"
        >
          <div className="flex h-full animate-in flex-col border-l border-border bg-card/90 shadow-lg slide-in-from-right duration-300 backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">{prompt.title}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Updated {formatDate(prompt.updated_at)}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleFavorite(prompt.id)}
                    className="h-7 w-7"
                    aria-label={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Icon
                      name="star"
                      size="md"
                      fill={prompt.is_favorite ? "currentColor" : "none"}
                      className={prompt.is_favorite ? "text-yellow-500" : ""}
                    />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(prompt)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Edit"
                  title="Edit"
                >
                  <Icon name="edit" size="md" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete"
                  title="Delete"
                >
                  <Icon name="delete" size="md" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                  title="Close"
                >
                  <Icon name="close" size="md" />
                </Button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 p-6">
                <div className="flex flex-wrap gap-2">
                  {prompt.category && (
                    <Badge className="gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary hover:bg-primary/10">
                      <Icon name="categories" size="xs" />
                      {prompt.category}
                    </Badge>
                  )}
                  {prompt.tags &&
                    prompt.tags.split(",").map((tag, i) => {
                      const trimmed = tag.trim();
                      if (!trimmed) return null;
                      return (
                        <Badge key={i} variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 font-normal">
                          <Icon name="tags" size="xs" />
                          {trimmed}
                        </Badge>
                      );
                    })}
                </div>

                {prompt.description && (
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{prompt.description}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Prompt Content</span>
                    <div className="flex items-center gap-1.5">
                      {/* Set switcher — only when there's at least one set AND the
                          prompt actually uses variables, otherwise it's pure noise. */}
                      {hasVariables && variableSets.length > 0 && (
                        <div className="w-44 min-w-0">
                          <Select
                            value={activeSetId !== null ? String(activeSetId) : ""}
                            onValueChange={(v) => {
                              const num = Number(v);
                              if (num) handleSelectSet(num);
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="No sets" />
                            </SelectTrigger>
                            <SelectContent>
                              {variableSets.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.name}
                                  {s.isActive ? " · active" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Tabs
                        value={view}
                        onValueChange={(v) => setView(v === "raw" ? "raw" : "preview")}
                        className="inline-flex"
                      >
                        <TabsList className="h-8">
                          <TabsTrigger value="preview" className="h-7 px-2.5 text-xs">
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="raw" className="h-7 px-2.5 text-xs">
                            Raw
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 gap-1.5 text-xs"
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
                  <div className="rounded-xl bg-muted/40 p-4">
                    {view === "raw" ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                        {text}
                      </pre>
                    ) : (
                      <div
                        key={`vars-${flashKey}`}
                        className={`markdown-preview ${flashKey > 0 ? "animate-in fade-in" : ""}`}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    )}
                  </div>
                  {/* Same wording as PreviewPanel: unfilled placeholders copy as-is. */}
                  {unfilled.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {unfilled.length === 1
                        ? "1 variable is unfilled — its {{placeholder}} will be copied as-is."
                        : `${unfilled.length} variables are unfilled — their {{placeholders}} will be copied as-is.`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 text-xs text-muted-foreground">
                  <span>Created: {formatDate(prompt.created_at)}</span>
                  <span>Updated: {formatDate(prompt.updated_at)}</span>
                </div>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move &ldquo;{prompt.title}&rdquo; to trash? You can restore it from the Trash page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
