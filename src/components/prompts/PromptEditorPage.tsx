import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { TagPreview } from "@/components/ui/tag-preview";
import type { PromptRow } from "@/types";

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

  const isEditing = !!prompt;
  const isDisabled = !title.trim() || !content.trim();

  return (
    <div className="space-y-6">
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
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </Button>
          </>
        }
      />

      <div className="rounded-xl border bg-card">
        <div className="p-6 space-y-6">
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
              placeholder="Write your prompt here..."
              rows={10}
              className="font-mono text-sm leading-relaxed resize-y min-h-[200px]"
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

        <div className="flex items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4 rounded-b-xl">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isDisabled}>
            {isEditing ? "Update Prompt" : "Create Prompt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
