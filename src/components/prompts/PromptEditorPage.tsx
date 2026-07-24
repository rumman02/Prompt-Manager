import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField, FormInput } from "@/components/ui/form-field";
import { TagPreview } from "@/components/ui/tag-preview";
import { HighlightedTextarea } from "@/components/prompts/HighlightedTextarea";
import { VersionHistorySidebar } from "@/components/prompts/VersionHistorySidebar";
import { VariablesSidebar } from "@/components/prompts/VariablesSidebar";
import { PreviewPanel } from "@/components/prompts/PreviewPanel";
import {
  SplitPane,
  OrientationToggle,
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
import type { PromptRow, PromptVersion } from "@/types";

// micro-label used above each field for a consistent, tracked-out technical feel
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-eyebrow block">
      {children}
    </label>
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
  const { getPromptVariables, savePromptVariable } = usePrompts();

  // Accordion state — which detected variable's value editor is open. Owned
  // here so it resets when the prompt changes.
  const [expandedVariable, setExpandedVariable] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // ── Split-pane layout state, persisted globally via Settings. ──
  const { settings, updateSettings } = useSettings();
  const [layout, setLayout] = useState<LayoutNode>(
    settings.editorLayout ?? DEFAULT_LAYOUT,
  );
  const [orientation, setOrientation] = useState<"h" | "v">(
    settings.editorSplitOrientation ?? "h",
  );

  // Persist layout + orientation whenever they change (debounced via rAF so a
  // long resize drag doesn't thrash localStorage every frame).
  const rafScheduled = useRef(false);
  const persistLayout = useCallback(
    (nextLayout: LayoutNode, nextOrientation: "h" | "v") => {
      if (rafScheduled.current) return;
      rafScheduled.current = true;
      requestAnimationFrame(() => {
        rafScheduled.current = false;
        updateSettings({
          editorLayout: nextLayout,
          editorSplitOrientation: nextOrientation,
        });
      });
    },
    [updateSettings],
  );

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setCategory(prompt.category || "");
      setTags(prompt.tags || "");
      setDescription(prompt.description || "");
      getPromptVariables(prompt.id)
        .then(setVariableValues)
        .catch(() => setVariableValues({}));
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      setDescription("");
      setVariableValues({});
    }
    setExpandedVariable(null);
  }, [prompt, getPromptVariables]);

  const handleSaveVariable = useCallback(
    async (name: string, value: string) => {
      if (!prompt) return;
      try {
        await savePromptVariable(prompt.id, name, value);
        setVariableValues((prev) => ({ ...prev, [name]: value }));
      } catch (e) {
        console.error("Failed to save variable value:", e);
      }
    },
    [prompt, savePromptVariable],
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
      persistLayout(next, orientation);
    },
    [layout, orientation, persistLayout],
  );
  const handleSplitPane = useCallback(
    (path: number[]) => {
      const next = splitPane(layout, path, orientation);
      setLayout(next);
      persistLayout(next, orientation);
    },
    [layout, orientation, persistLayout],
  );
  const handleClosePane = useCallback(
    (path: number[]) => {
      const next = closePane(layout, path);
      setLayout(next);
      persistLayout(next, orientation);
    },
    [layout, orientation, persistLayout],
  );
  const handleResize = useCallback(
    (path: number[], sizes: number[]) => {
      const next = resizeSplit(layout, path, sizes);
      setLayout(next);
      persistLayout(next, orientation);
    },
    [layout, orientation, persistLayout],
  );
  const handleOrientationChange = useCallback(
    (o: "h" | "v") => {
      setOrientation(o);
      persistLayout(layout, o);
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
            <div className="flex-1 overflow-auto px-6 py-5">
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

              <div className="mt-5">
                <FieldLabel htmlFor="content">Prompt Content</FieldLabel>
                <div className="mt-1">
                  <HighlightedTextarea
                    id="content"
                    value={content}
                    onChange={setContent}
                    placeholder={"Write your prompt here. Markdown is supported (headings, bold, lists, code, links…).\nUse {{variable_name}} for placeholders — they'll highlight as you type."}
                    rows={14}
                    className="min-h-[260px]"
                    ref={contentTextareaRef}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--code-bg))] p-4">
                <div className="text-eyebrow mb-3">Details</div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <FormInput
                      id="description"
                      value={description}
                      onChange={setDescription}
                      placeholder="Brief description of this prompt..."
                      className="text-meta border-transparent bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-[hsl(var(--border))]"
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
                        className="text-meta border-transparent bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-[hsl(var(--border))]"
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
                        className="text-meta border-transparent bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-[hsl(var(--border))]"
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
              content={content}
              onInsertVariable={handleInsertVariable}
              promptId={prompt?.id ?? null}
              variableValues={variableValues}
              onSaveVariable={handleSaveVariable}
              expandedName={expandedVariable}
              onToggleExpand={handleToggleExpandVariable}
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
      expandedVariable,
      prompt?.id,
      isEditing,
      handleInsertVariable,
      handleSaveVariable,
      handleToggleExpandVariable,
      handleRestoreVersion,
    ],
  );

  return (
    <div className="flex h-full flex-col">
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        }
        backButton={{ label: "Back", onClick: onBack }}
        title={isEditing ? "Edit Prompt" : "Create New Prompt"}
        subtitle={
          isEditing
            ? "Update your prompt details below"
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

      {/* Orientation toggle — lives in the header-adjacent strip, not buried in
          settings. It controls the orientation of the *next* split. */}
      <div className="flex shrink-0 items-center justify-end border-b border-border bg-card px-3 py-1.5">
        <OrientationToggle orientation={orientation} onChange={handleOrientationChange} />
      </div>

      {saveError && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-start gap-2 rounded-[10px] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1">
            <span className="font-medium">Failed to save:</span> {saveError}
          </div>
          <button onClick={() => setSaveError(null)} className="text-destructive/70 hover:text-destructive" aria-label="Dismiss error">
            ✕
          </button>
        </div>
      )}

      {/* Split-pane editor area. rounded-r-xl: right corners only; border-r-0 so
          the rightmost pane docks flush against the window edge. */}
      <div className="flex flex-1 min-h-0 rounded-r-xl border border-r-0 border-border bg-card">
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
