import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageHeader } from "@/components/ui/page-header";
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
  const [showVersionSidebar, setShowVersionSidebar] = useState(true);
  const [showVariableSidebar, setShowVariableSidebar] = useState(true);
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
      {/* Top bar with breadcrumb and header */}
      <div className="space-y-6 pb-4">
        <Breadcrumb
          items={[
            { label: "Prompts", onClick: onBack },
            { label: isEditing ? "Edit Prompt" : "Create New Prompt" },
          ]}
          onBack={onBack}
        />

        <PageHeader
          title={isEditing ? "Edit Prompt" : "Create New Prompt"}
          description={
            isEditing
              ? "Update your prompt details below"
              : "Fill in the details to create a new prompt"
          }
          actions={
            <>
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant={showVersionSidebar ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowVersionSidebar(!showVersionSidebar)}
                  title="Toggle version history"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </Button>
                <Button
                  variant={showVariableSidebar ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowVariableSidebar(!showVariableSidebar)}
                  title="Toggle variables panel"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 2.25h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M4.745 21.75h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M2.25 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01M21.75 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01" />
                  </svg>
                  Variables
                </Button>
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
      </div>

      {/* Main editor area with sidebars */}
      <div className="flex flex-1 min-h-0 rounded-xl border bg-card">
        {/* Version History Sidebar */}
        {showVersionSidebar && (
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
        )}

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

          {/* Bottom action bar */}
          <div className="flex items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </Button>
          </div>
        </div>

        {/* Variables Sidebar */}
        {showVariableSidebar && (
          <VariablesSidebar
            content={content}
            onInsertVariable={handleInsertVariable}
          />
        )}
      </div>
    </div>
  );
}
