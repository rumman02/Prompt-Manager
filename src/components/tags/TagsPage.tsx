import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Input } from "@/components/ui/input";
import { RESOURCE_COLORS, resourceColor } from "@/constants/colors";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const handleRenameTag = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    try {
      const promptsWithTag = prompts.filter((p) =>
        p.tags?.split(",").map((t) => t.trim()).includes(oldName)
      );
      for (const prompt of promptsWithTag) {
        const updatedTags = prompt.tags!
          .split(",")
          .map((t) => t.trim())
          .map((t) => (t === oldName ? trimmed : t));

        await invoke("update_prompt", {
          id: prompt.id,
          title: null,
          content: null,
          category: null,
          tags: updatedTags.join(", "),
          description: null,
        });
      }
      await loadPrompts();
      onRefresh();
    } catch (e) {
      console.error("Failed to rename tag:", e);
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
        title="Tags"
        subtitle={`${filteredTags.length} tag${filteredTags.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tags..."
            />
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Tags
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">

      {filteredTags.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTags.map((tag) => (
              <TagCard
                key={tag.name}
                tag={tag}
                onRename={(name) => {
                  const newName = prompt(`Rename tag "${name}" to:`, name);
                  if (newName?.trim()) handleRenameTag(name, newName.trim());
                }}
                onDelete={() => handleDeleteTag(tag.name)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 auto-rows-auto rounded-xl border bg-card shadow-macos-window overflow-hidden">
            <div className="grid col-span-3 grid-cols-subgrid border-b bg-muted/30 px-4 py-2.5 text-eyebrow">
              <span>Tag</span>
              <span className="w-28 text-center">Prompts</span>
              <span className="w-28 text-right">Actions</span>
            </div>
            <div className="grid col-span-3 grid-cols-subgrid divide-y contents">
              {filteredTags.map((tag) => (
                <div
                  key={tag.name}
                  className="group grid col-span-3 grid-cols-subgrid gap-x-4 items-center px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${resourceColor(tag.name).bg} ${resourceColor(tag.name).text}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium truncate">{tag.name}</span>
                  </div>
                  <div className="w-28 flex items-center justify-center">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {tag.count} prompt{tag.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-28 flex items-center justify-end">
                    <ActionsMenu
                      items={[
                        { label: "Rename", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10", onClick: () => {
                          const newName = prompt(`Rename tag "${tag.name}" to:`, tag.name);
                          if (newName?.trim()) handleRenameTag(tag.name, newName.trim());
                        } },
                        { label: "Delete", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0", onClick: () => handleDeleteTag(tag.name), destructive: true },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          icon={
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
          title={searchQuery ? "No tags found" : "No tags yet"}
          description={searchQuery ? `No tags match "${searchQuery}"` : "Add tags to your prompts to see them here"}
        />
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

function TagCard({
  tag,
  onRename,
  onDelete,
}: {
  tag: TagInfo;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const color = resourceColor(tag.name);
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-macos-button hover:bg-muted/20">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{tag.name}</div>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {tag.count} prompt{tag.count !== 1 ? "s" : ""}
          </span>
        </div>
        <ActionsMenu
          items={[
            { label: "Rename", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10", onClick: () => onRename(tag.name) },
            { label: "Delete", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0", onClick: onDelete, destructive: true },
          ]}
        />
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
    <Modal
      open={true}
      onClose={onClose}
      title="Add Tags"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onAdd} disabled={!selectedPromptId || !newTags.trim() || isLoading}>
            {isLoading ? "Adding..." : "Add Tags"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt-select">Select Prompt</Label>
          <select
            id="prompt-select"
            value={selectedPromptId ?? ""}
            onChange={(e) => setSelectedPromptId(Number(e.target.value) || null)}
            className="flex h-8 w-full rounded-[6px] border border-input bg-background px-3 py-1.5 pr-8 text-sm shadow-macos-inset ring-offset-background appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
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
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      {trimmed}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
