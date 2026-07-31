import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormInput } from "@/components/ui/form-field";
import { TagPreview } from "@/components/ui/tag-preview";
import { HighlightedTextarea } from "@/components/prompts/HighlightedTextarea";
import { VersionHistorySidebar } from "@/components/prompts/VersionHistorySidebar";
import { VariablesSidebar } from "@/components/prompts/VariablesSidebar";
import { PreviewPanel } from "@/components/prompts/PreviewPanel";
import { Icon } from "@/components/ui/icon";
import {
  SplitPane,
  makePane,
  makeSplit,
  makeSplitEven,
  type ViewId,
  type LayoutNode,
  type Pane,
  type Split,
} from "@/components/prompts/SplitPane";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrompts } from "@/hooks/usePrompts";
import { getContentStats } from "@/lib/utils";
import type { PromptRow, PromptVersion, VariableSet } from "@/types";
import { PanelStatusBar } from "@/components/prompts/PanelStatusBar";

// micro-label used above each field for a consistent, tracked-out technical feel
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-eyebrow block">
      {children}
    </label>
  );
}

// Compact status bar for the Meta pane — a one-line summary of the prompt's
// metadata so the Meta tab's top bar aligns with Edit/Preview/Variables/History.
function MetaStatsBar({
  category,
  tags,
}: {
  category: string;
  tags: string;
}) {
  const tagCount = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean).length;
  const items = [
    `Category: ${category.trim() || "None"}`,
    `${tagCount} tag${tagCount === 1 ? "" : "s"}`,
  ];
  return (
    <PanelStatusBar>
      {items.map((label, i) => (
        <span key={i} className="flex items-center gap-x-2.5">
          {i > 0 && <span aria-hidden className="h-3 w-px bg-border" />}
          <span>{label}</span>
        </span>
      ))}
    </PanelStatusBar>
  );
}

// Slim status bar shown above the editor in the Edit pane. Recomputes on every
// `content` change (the work is trivial) so the counts track typing live.
function EditStatsBar({ content }: { content: string }) {
  const stats = getContentStats(content);
  const items = [
    `${stats.words} word${stats.words === 1 ? "" : "s"}`,
    `${stats.tokens} token${stats.tokens === 1 ? "" : "s"}`,
    `${stats.sentences} sentence${stats.sentences === 1 ? "" : "s"}`,
    `${stats.paragraphs} paragraph${stats.paragraphs === 1 ? "" : "s"}`,
    `${stats.variables} variable${stats.variables === 1 ? "" : "s"}`,
  ];
  return (
    <PanelStatusBar>
      {items.map((label, i) => (
        <span key={i} className="flex items-center gap-x-2.5">
          {i > 0 && <span aria-hidden className="h-3 w-px bg-border" />}
          <span className="tabular-nums">{label}</span>
        </span>
      ))}
    </PanelStatusBar>
  );
}

export interface PromptFormData {
  title: string;
  content: string;
  category: string;
  tags: string;
  description: string;
}

interface PromptEditorPageProps {
  prompt: PromptRow | null;
  categories: string[];
  onBack: () => void;
  onSave: (data: PromptFormData) => Promise<void>;
}

// ─── Layout helpers ──────────────────────────────────────────────────────────
// The layout is a tree of splits + leaf panes. All mutations are pure
// functions over that tree; the parent owns the tree and persists it.

function paneCount(node: LayoutNode): number {
  if (node.kind === "pane") return 1;
  return node.children.reduce((acc, c) => acc + paneCount(c), 0);
}

function getPaneAt(root: LayoutNode, path: number[]): LayoutNode | null {
  let cur: LayoutNode = root;
  for (const idx of path) {
    if (cur.kind === "pane") return null;
    if (idx < 0 || idx >= cur.children.length) return null;
    cur = cur.children[idx];
  }
  return cur;
}

function mapAt(
  root: LayoutNode,
  path: number[],
  fn: (node: LayoutNode) => LayoutNode,
): LayoutNode {
  if (path.length === 0) return fn(root);
  const [idx, ...rest] = path;
  if (root.kind === "pane") throw new Error("bad path");
  return makeSplit(
    root.orientation,
    root.sizes,
    root.children.map((c, i) => (i === idx ? mapAt(c, rest, fn) : c)),
  );
}

/** Switch the view of the pane at `path` (in place). */
function switchView(root: LayoutNode, path: number[], view: ViewId): LayoutNode {
  return mapAt(root, path, (node) =>
    node.kind === "pane" ? makePane(view) : node,
  );
}

/** Split the pane at `path`: clone it into a new sibling, using `orientation`
 *  for the new split container. */
function splitPane(
  root: LayoutNode,
  path: number[],
  orientation: "h" | "v",
): LayoutNode {
  return mapAt(root, path, (node) =>
    node.kind === "pane"
      ? makeSplitEven(orientation, [node, makePane(node.view)])
      : node,
  );
}

/** Close the pane at `path`. Re-promotes the sibling when a split drops to one
 *  child, so the tree never holds a degenerate single-child split. */
function closePane(root: LayoutNode, path: number[]): LayoutNode {
  if (path.length === 0) return root; // can't close the root
  const parentPath = path.slice(0, -1);
  const childIdx = path[path.length - 1];
  const parent = getPaneAt(root, parentPath);
  if (!parent || parent.kind === "pane") return root;
  if (parent.children.length <= 1) return root;

  const nextChildren = parent.children.filter((_, i) => i !== childIdx);
  if (nextChildren.length === 1) {
    // Re-promote the lone sibling into the parent's slot.
    const promoted = nextChildren[0];
    if (parentPath.length === 0) return promoted;
    return mapAt(root, parentPath, () => promoted);
  }
  const sizes = nextChildren.map(() => 1 / nextChildren.length);
  return mapAt(root, parentPath, () =>
    makeSplit(parent.orientation, sizes, nextChildren),
  );
}

/** Resize two adjacent children of the split at `path`. */
function resizeSplit(root: LayoutNode, path: number[], sizes: number[]): LayoutNode {
  if (path.length === 0) {
    if (root.kind === "split") return makeSplit(root.orientation, sizes, root.children);
    return root;
  }
  return mapAt(root, path, (node) =>
    node.kind === "split" ? makeSplit(node.orientation, sizes, node.children) : node,
  );
}

const DEFAULT_LAYOUT: LayoutNode = makePane("edit");

export function PromptEditorPage({
  prompt,
  categories,
  onBack,
  onSave,
}: PromptEditorPageProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    getPromptVariables,
    savePromptVariable,
    createVariableSet,
    listVariableSets,
    setActiveVariableSet,
    deleteVariableSet,
  } = usePrompts();

  // Accordion state — which detected variable's value editor is open. Owned
  // here so it resets when the prompt changes.
  const [expandedVariable, setExpandedVariable] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  // The prompt's variable sets and the one currently being read/written.
  const [variableSets, setVariableSets] = useState<VariableSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<number | null>(null);
  // Dedupe concurrent "ensure a set exists" refreshes (hydration + a save that
  // lands before hydration finishes) so they can't both create a Default set.
  const variableSetsLoadingRef = useRef<Promise<number | null> | null>(null);

  // ── Split-pane layout state, persisted globally via Settings. ──
  const { settings, updateSettings } = useSettings();
  const [layout, setLayout] = useState<LayoutNode>(
    settings.editorLayout ?? DEFAULT_LAYOUT,
  );
  // Persist layout whenever it changes (debounced via rAF so a long resize drag
  // doesn't thrash localStorage every frame).
  const rafScheduled = useRef(false);
  const persistLayout = useCallback(
    (nextLayout: LayoutNode) => {
      if (rafScheduled.current) return;
      rafScheduled.current = true;
      requestAnimationFrame(() => {
        rafScheduled.current = false;
        updateSettings({ editorLayout: nextLayout });
      });
    },
    [updateSettings],
  );

  // Load (or lazily create) the prompt's sets, guaranteeing exactly one active
  // set exists, and return its id. Shared so concurrent callers coalesce.
  const refreshVariableSets = useCallback(
    (pid: number): Promise<number | null> => {
      if (variableSetsLoadingRef.current) return variableSetsLoadingRef.current;
      const p = (async () => {
        let sets = await listVariableSets(pid);
        if (sets.length === 0) {
          const id = await createVariableSet(pid, "Default");
          sets = [{ id, name: "Default", isActive: true }];
        } else if (!sets.some((s) => s.isActive)) {
          await setActiveVariableSet(pid, sets[0].id);
          sets = sets.map((s, i) => ({ ...s, isActive: i === 0 }));
        }
        setVariableSets(sets);
        const active = sets.find((s) => s.isActive) ?? sets[0];
        setActiveSetId(active?.id ?? null);
        return active?.id ?? null;
      })().finally(() => {
        variableSetsLoadingRef.current = null;
      });
      variableSetsLoadingRef.current = p;
      return p;
    },
    [listVariableSets, createVariableSet, setActiveVariableSet]
  );

  useEffect(() => {
    setExpandedVariable(null);
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setCategory(prompt.category || "");
      setTags(prompt.tags || "");
      setDescription(prompt.description || "");
      let cancelled = false;
      (async () => {
        try {
          // Ensure a set exists before loading values — get_prompt_variables
          // filters by the active set, so an empty set list would read as "no
          // values" even for a prompt that already has saved ones.
          await refreshVariableSets(prompt.id);
          if (cancelled) return;
          const values = await getPromptVariables(prompt.id);
          if (!cancelled) setVariableValues(values);
        } catch (e) {
          console.error("Failed to load variable values:", e);
          if (!cancelled) setVariableValues({});
        }
      })();
      return () => {
        cancelled = true;
      };
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      setDescription("");
      setVariableValues({});
      setVariableSets([]);
      setActiveSetId(null);
    }
  }, [prompt, refreshVariableSets, getPromptVariables]);

  const handleSaveVariable = useCallback(
    async (name: string, value: string) => {
      if (!prompt) return;
      try {
        // Guard: a fast-typing user can trigger a save before the sets finish
        // hydrating; ensure there's a set to write into first.
        let setId = activeSetId;
        if (setId === null) {
          setId = await refreshVariableSets(prompt.id);
        }
        if (setId === null) return;
        await savePromptVariable(prompt.id, setId, name, value);
        setVariableValues((prev) => ({ ...prev, [name]: value }));
      } catch (e) {
        console.error("Failed to save variable value:", e);
      }
    },
    [prompt, activeSetId, refreshVariableSets, savePromptVariable]
  );

  const handleSelectSet = useCallback(
    async (setId: number) => {
      if (!prompt) return;
      try {
        await setActiveVariableSet(prompt.id, setId);
        setVariableSets((prev) => prev.map((s) => ({ ...s, isActive: s.id === setId })));
        setActiveSetId(setId);
        setVariableValues(await getPromptVariables(prompt.id));
      } catch (e) {
        console.error("Failed to switch variable set:", e);
      }
    },
    [prompt, setActiveVariableSet, getPromptVariables]
  );

  const handleCreateSet = useCallback(
    async (name: string) => {
      if (!prompt) return;
      try {
        await createVariableSet(prompt.id, name);
        const sets = await listVariableSets(prompt.id);
        setVariableSets(sets);
        const active = sets.find((s) => s.isActive) ?? sets[0];
        setActiveSetId(active?.id ?? null);
      } catch (e) {
        console.error("Failed to create variable set:", e);
      }
    },
    [prompt, createVariableSet, listVariableSets]
  );

  const handleDeleteSet = useCallback(
    async (setId: number) => {
      if (!prompt) return;
      try {
        await deleteVariableSet(setId);
        const sets = await listVariableSets(prompt.id);
        setVariableSets(sets);
        const active = sets.find((s) => s.isActive) ?? sets[0];
        setActiveSetId(active?.id ?? null);
        // The active set may have switched (deleting it promotes another), so
        // reload the values the editor and preview show.
        setVariableValues(await getPromptVariables(prompt.id));
      } catch (e) {
        console.error("Failed to delete variable set:", e);
      }
    },
    [prompt, deleteVariableSet, listVariableSets, getPromptVariables]
  );

  const handleToggleExpandVariable = useCallback((name: string) => {
    setExpandedVariable((prev) => (prev === name ? null : name));
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaveError(null);
    try {
      await onSave({ title, content, category, tags, description });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRestoreVersion = useCallback((version: PromptVersion) => {
    setTitle(version.title);
    setContent(version.content);
    setCategory(version.category || "");
    setTags(version.tags || "");
    setDescription(version.description || "");
  }, []);

  const handleInsertVariable = useCallback((variable: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + variable + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }, [content]);

  const isEditing = !!prompt;
  const isDisabled = !title.trim() || !content.trim();

  // ── Layout mutation handlers (wired to SplitPane). ──
  const count = useMemo(() => paneCount(layout), [layout]);
  const handleSwitchView = useCallback(
    (path: number[], view: ViewId) => {
      const next = switchView(layout, path, view);
      setLayout(next);
      persistLayout(next);
    },
    [layout, persistLayout],
  );
  const handleSplitPane = useCallback(
    (path: number[], orientation: "h" | "v") => {
      const next = splitPane(layout, path, orientation);
      setLayout(next);
      persistLayout(next);
    },
    [layout, persistLayout],
  );
  const handleClosePane = useCallback(
    (path: number[]) => {
      const next = closePane(layout, path);
      setLayout(next);
      persistLayout(next);
    },
    [layout, persistLayout],
  );
  const handleResize = useCallback(
    (path: number[], sizes: number[]) => {
      const next = resizeSplit(layout, path, sizes);
      setLayout(next);
      persistLayout(next);
    },
    [layout, persistLayout],
  );

  // ── Per-view renderers. The Edit view is the full editor; the others are
  //    the refactored sidebars (no resize/collapse props). ──
  const renderPane = useCallback(
    (view: ViewId) => {
      switch (view) {
        case "edit":
          return (
            <div className="flex h-full flex-col">
              {/* Live stats bar — word / token / sentence / paragraph / variable
                  counts update as the user types, mirroring a code editor's
                  status bar. Shares PanelStatusBar chrome with the Preview pane's
                  unfilled-variables helper so the two top bars align. */}
              <EditStatsBar content={content} />
              <div className="min-h-0 flex-1 px-3 py-2">
              <HighlightedTextarea
                id="content"
                value={content}
                onChange={setContent}
                placeholder={"Write your prompt here. Markdown is supported (headings, bold, lists, code, links).\nUse {{variable_name}} for placeholders — they'll highlight as you type."}
                fill
                className="h-full"
                ref={contentTextareaRef}
              />
              </div>
            </div>
          );
        case "meta":
          return (
            <div className="flex h-full flex-col">
              <MetaStatsBar category={category} tags={tags} />
              <div className="min-h-0 overflow-auto px-6 py-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <FormInput
                    id="title"
                    value={title}
                    onChange={setTitle}
                    placeholder="Enter prompt title..."
                    className="text-lead h-11 border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <FormInput
                    id="description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Brief description of this prompt..."
                    className="h-11 border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <FormInput
                      id="category"
                      value={category}
                      onChange={setCategory}
                      placeholder="e.g. Writing, Coding…"
                      list="category-suggestions"
                      className="h-11 border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                    />
                    <datalist id="category-suggestions">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <FieldLabel htmlFor="tags">Tags</FieldLabel>
                    <FormInput
                      id="tags"
                      value={tags}
                      onChange={setTags}
                      placeholder="comma, separated, tags"
                      className="h-11 border-0 border-b border-[hsl(var(--border))] bg-transparent px-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                    />
                  </div>
                </div>

                {tags.trim() && (
                  <div className="pt-1">
                    <TagPreview tags={tags} />
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        case "preview":
          return (
            <PreviewPanel content={content} variableValues={variableValues} />
          );
        case "variables":
          return (
            <VariablesSidebar
              // Remount on set switch so in-flight draft values (which belong to
              // the previous set) don't linger in the editor's textareas.
              key={activeSetId ?? "no-set"}
              content={content}
              onInsertVariable={handleInsertVariable}
              promptId={prompt?.id ?? null}
              variableValues={variableValues}
              onSaveVariable={handleSaveVariable}
              expandedName={expandedVariable}
              onToggleExpand={handleToggleExpandVariable}
              variableSets={variableSets}
              activeSetId={activeSetId}
              onSelectSet={handleSelectSet}
              onCreateSet={handleCreateSet}
              onDeleteSet={handleDeleteSet}
            />
          );
        case "history":
          return (
            <VersionHistorySidebar
              promptId={prompt?.id ?? null}
              title={title}
              content={content}
              category={category}
              tags={tags}
              description={description}
              onRestore={handleRestoreVersion}
              isEditing={isEditing}
            />
          );
      }
    },
    [
      title,
      content,
      category,
      tags,
      description,
      categories,
      variableValues,
      variableSets,
      activeSetId,
      expandedVariable,
      prompt?.id,
      isEditing,
      handleInsertVariable,
      handleSaveVariable,
      handleToggleExpandVariable,
      handleRestoreVersion,
      handleSelectSet,
      handleCreateSet,
      handleDeleteSet,
    ],
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon="edit"
        backButton={{ label: "Back", onClick: onBack }}
        title={isEditing ? (title.trim() || "Untitled Prompt") : "Create New Prompt"}
        subtitle={
          isEditing
            ? (description.trim() || "No description")
            : "Fill in the details to create a new prompt"
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={onBack} className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </Button>
          </>
        }
      />

      {saveError && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <Icon name="alert" size="md" className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-medium">Failed to save:</span> {saveError}
          </div>
          <button onClick={() => setSaveError(null)} className="text-destructive/70 hover:text-destructive" aria-label="Dismiss error">
            <Icon name="close" size="sm" />
          </button>
        </div>
      )}

      {/* Split-pane editor area. No outer frame — the per-pane tab strips and
          their content borders define the panels, so the whole editor sits
          flush and matches the rest of the page. */}
      <div className="flex flex-1 min-h-0 rounded-r-xl bg-card">
        <SplitPane
          layout={layout}
          paneCount={count}
          renderPane={renderPane}
          onSwitchView={handleSwitchView}
          onSplitPane={handleSplitPane}
          onClosePane={handleClosePane}
          onResize={handleResize}
        />
      </div>
    </div>
  );
}
