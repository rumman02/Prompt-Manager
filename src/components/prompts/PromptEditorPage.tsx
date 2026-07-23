import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { TagPreview } from "@/components/ui/tag-preview";
import { VersionHistorySidebar } from "@/components/prompts/VersionHistorySidebar";
import { VariablesSidebar } from "@/components/prompts/VariablesSidebar";
import type { PromptRow, PromptVersion } from "@/types";

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
  onSave: (data: PromptFormData) => void;
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
  const [isVersionSidebarCollapsed, setIsVersionSidebarCollapsed] = useState(false);
  const [isVariableSidebarCollapsed, setIsVariableSidebarCollapsed] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title, content, category, tags, description });
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
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </Button>
          </>
        }
      />

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

      {/* Main editor area with sidebars */}
      <div className="flex flex-1 min-h-0 rounded-xl border bg-card">
        {/* Version History Sidebar */}
        <VersionHistorySidebar
          promptId={prompt?.id ?? null}
          title={title}
          content={content}
          category={category}
          tags={tags}
          description={description}
          onRestore={handleRestoreVersion}
          isEditing={isEditing}
          collapsed={isVersionSidebarCollapsed}
          onToggle={() => setIsVersionSidebarCollapsed((v) => !v)}
        />

        {/* Main editor content */}
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
                placeholder="Write your prompt here... Use {variable_name} for variables."
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

        {/* Variables Sidebar */}
        <VariablesSidebar
          content={content}
          onInsertVariable={handleInsertVariable}
          collapsed={isVariableSidebarCollapsed}
          onToggle={() => setIsVariableSidebarCollapsed((v) => !v)}
        />
      </div>
    </div>
  );
}
