import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import type { PromptRow } from "@/types";

interface TagInfo {
  name: string;
  count: number;
}

interface TagsPageProps {
  onRefresh: () => void;
}

export function TagsPage({ onRefresh }: TagsPageProps) {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [newTags, setNewTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const result = await invoke<PromptRow[]>("get_prompts");
      setPrompts(result);
    } catch (e) {
      console.error("Failed to load prompts:", e);
    }
  };

  const tags: TagInfo[] = useMemo(() => {
    const tagMap = new Map<string, number>();
    prompts.forEach((prompt) => {
      if (prompt.tags) {
        prompt.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          });
      }
    });
    return Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
  }, [prompts]);

  const filteredTags = useMemo(() => {
    let filtered = tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.count - a.count;
    });
    return filtered;
  }, [tags, searchQuery, sortBy]);

  const handleAddTags = async () => {
    if (!selectedPromptId || !newTags.trim()) return;
    setIsLoading(true);
    try {
      const prompt = prompts.find((p) => p.id === selectedPromptId);
      if (!prompt) return;

      const existingTags = prompt.tags
        ? prompt.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const tagsToAdd = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      const allTags = [...new Set([...existingTags, ...tagsToAdd])];

      await invoke("update_prompt", {
        id: selectedPromptId,
        title: null,
        content: null,
        category: null,
        tags: allTags.join(", "),
        description: null,
      });

      setIsAddModalOpen(false);
      setNewTags("");
      setSelectedPromptId(null);
      await loadPrompts();
      onRefresh();
    } catch (e) {
      console.error("Failed to add tags:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    const promptsWithTag = prompts.filter((p) =>
      p.tags?.split(",").map((t) => t.trim()).includes(tagName)
    );

    try {
      for (const prompt of promptsWithTag) {
        const updatedTags = prompt.tags!
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== tagName);

        await invoke("update_prompt", {
          id: prompt.id,
          title: null,
          content: null,
          category: null,
          tags: updatedTags.length > 0 ? updatedTags.join(", ") : null,
          description: null,
        });
      }
      await loadPrompts();
      onRefresh();
    } catch (e) {
      console.error("Failed to delete tag:", e);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        }
        title="All Tags"
        subtitle={`${filteredTags.length} tag${filteredTags.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Tags
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex rounded-md border bg-muted/30 p-1">
            <button
              onClick={() => setSortBy("name")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === "name" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy("count")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === "count" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Count
            </button>
          </div>
        </div>
      </div>

      {filteredTags.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTags.map((tag) => (
            <TagCard
              key={tag.name}
              tag={tag}
              onDelete={() => handleDeleteTag(tag.name)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? "No tags found" : "No tags yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? `No tags match "${searchQuery}"` : "Add tags to your prompts to see them here"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Tags
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isAddModalOpen && (
        <AddTagsModal
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          setSelectedPromptId={setSelectedPromptId}
          newTags={newTags}
          setNewTags={setNewTags}
          onClose={() => {
            setIsAddModalOpen(false);
            setNewTags("");
            setSelectedPromptId(null);
          }}
          onAdd={handleAddTags}
          isLoading={isLoading}
        />
      )}
      </div>
    </div>
  );
}

function TagCard({ tag, onDelete }: { tag: TagInfo; onDelete: () => void }) {
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{tag.name}</div>
            <div className="text-xs text-muted-foreground">
              {tag.count} prompt{tag.count !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
          title="Delete tag from all prompts"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </CardContent>
    </Card>
  );
}

function AddTagsModal({
  prompts,
  selectedPromptId,
  setSelectedPromptId,
  newTags,
  setNewTags,
  onClose,
  onAdd,
  isLoading,
}: {
  prompts: PromptRow[];
  selectedPromptId: number | null;
  setSelectedPromptId: (id: number | null) => void;
  newTags: string;
  setNewTags: (tags: string) => void;
  onClose: () => void;
  onAdd: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-card shadow-2xl border">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Add Tags</h2>
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
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Prompt</Label>
            <select
              id="prompt-select"
              value={selectedPromptId ?? ""}
              onChange={(e) => setSelectedPromptId(Number(e.target.value) || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a prompt...</option>
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </option>
              ))}
            </select>
          </div>

          {selectedPromptId && (
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {prompts
                  .find((p) => p.id === selectedPromptId)
                  ?.tags?.split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  )) || (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-tags">New Tags</Label>
            <Input
              id="new-tags"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Comma-separated tags (e.g., creative, short, formal)"
            />
            {newTags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {newTags
                  .split(",")
                  .map((tag, i) => {
                    const trimmed = tag.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {trimmed}
                      </span>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={!selectedPromptId || !newTags.trim() || isLoading}
          >
            {isLoading ? "Adding..." : "Add Tags"}
          </Button>
        </div>
      </div>
    </div>
  );
}
