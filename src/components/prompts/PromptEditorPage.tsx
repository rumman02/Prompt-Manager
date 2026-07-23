import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { TagPreview } from "@/components/ui/tag-preview";
import { VersionHistorySidebar } from "@/components/prompts/VersionHistorySidebar";
import { VariablesSidebar } from "@/components/prompts/VariablesSidebar";
import { useResizable } from "@/hooks/useResizable";
import type { PromptRow, PromptVersion } from "@/types";

type RightPanel = "history" | "variables";

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
  const [activePanel, setActivePanel] = useState<RightPanel>("history");
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Free-mode max width: the panel can grow up to ~60% of the available editor
  // width (measured live), so it adapts to the window instead of a hard 480px cap.
  const [maxPanelWidth, setMaxPanelWidth] = useState(480);
  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const update = () => setMaxPanelWidth(Math.max(320, Math.round(el.clientWidth * 0.6)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Shared resize state for the single right-side panel slot — width persists
  // when toggling between History and Variables so the panel doesn't jump.
  const { width, onResizeStart, isResizing } = useResizable({
    initial: 256,
    min: 200,
    max: maxPanelWidth,
    side: "right",
  });

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setCategory(prompt.category || "");
      setTags(prompt.tags || "");
      setDescription(prompt.description || "");
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      setDescription("");
    }
  }, [prompt]);

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

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }, [content]);

  const isEditing = !!prompt;
  const isDisabled = !title.trim() || !content.trim();

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
        title={isEditing ? "Edit Prompt" : "Create New Prompt"}
        subtitle={
          isEditing
            ? "Update your prompt details below"
            : "Fill in the details to create a new prompt"
        }
        actions={
          <>
            {/* Right-panel selector — only one panel visible at a time on the right. */}
            <div className="flex items-center rounded-md border bg-background p-0.5">
              <button
                onClick={() => {
                  setActivePanel("history");
                  setIsRightPanelCollapsed(false);
                }}
                title="Show version history"
                className={
                  "flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium transition-colors " +
                  (activePanel === "history" && !isRightPanelCollapsed
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
              <button
                onClick={() => {
                  setActivePanel("variables");
                  setIsRightPanelCollapsed(false);
                }}
                title="Show variables"
                className={
                  "flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium transition-colors " +
                  (activePanel === "variables" && !isRightPanelCollapsed
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 2.25h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M4.745 21.75h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M2.25 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01M21.75 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01" />
                </svg>
                Variables
              </button>
            </div>
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </Button>
          </>
        }
      />

      {/* Inline error banner — surfaces backend/invoke failures that were
          previously swallowed by console.error-only handlers. */}
      {saveError && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
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

      {/* Back button row */}
      <div className="px-6 pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Prompts
        </button>
      </div>

      {/* Main editor area — content fills all space; right panel is the only sidebar. */}
      <div ref={editorContainerRef} className="flex flex-1 min-h-0 rounded-xl border bg-card">
        {/* Main editor content — flex-1 so it expands when no panel is docked on the left. */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <FormField label="Title *" htmlFor="title">
              <FormInput
                id="title"
                value={title}
                onChange={setTitle}
                placeholder="Enter prompt title..."
                className="text-base"
              />
            </FormField>

            <FormField label="Prompt Content *" htmlFor="content">
              <FormTextarea
                id="content"
                value={content}
                onChange={setContent}
                placeholder="Write your prompt here... Use {{variable_name}} for variables."
                rows={12}
                className="font-mono text-sm leading-relaxed resize-y min-h-[200px]"
                ref={contentTextareaRef}
              />
            </FormField>

            <FormField label="Description" htmlFor="description">
              <FormTextarea
                id="description"
                value={description}
                onChange={setDescription}
                placeholder="Brief description of this prompt..."
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Category" htmlFor="category">
                <FormInput
                  id="category"
                  value={category}
                  onChange={setCategory}
                  placeholder="e.g., Writing, Coding, Marketing..."
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </FormField>

              <FormField label="Tags" htmlFor="tags">
                <FormInput
                  id="tags"
                  value={tags}
                  onChange={setTags}
                  placeholder="Comma-separated tags (e.g., creative, short, formal)"
                />
              </FormField>
            </div>

            <FormField label="Tag Preview" htmlFor="">
              <TagPreview tags={tags} />
            </FormField>
          </div>
        </div>

        {/* Single right-side panel slot — History or Variables, one at a time. */}
        {activePanel === "history" ? (
          <VersionHistorySidebar
            promptId={prompt?.id ?? null}
            title={title}
            content={content}
            category={category}
            tags={tags}
            description={description}
            onRestore={handleRestoreVersion}
            isEditing={isEditing}
            collapsed={isRightPanelCollapsed}
            onToggle={() => setIsRightPanelCollapsed((v) => !v)}
            width={width}
            onResizeStart={onResizeStart}
            isResizing={isResizing}
          />
        ) : (
          <VariablesSidebar
            content={content}
            onInsertVariable={handleInsertVariable}
            collapsed={isRightPanelCollapsed}
            onToggle={() => setIsRightPanelCollapsed((v) => !v)}
            width={width}
            onResizeStart={onResizeStart}
            isResizing={isResizing}
          />
        )}
      </div>
    </div>
  );
}
