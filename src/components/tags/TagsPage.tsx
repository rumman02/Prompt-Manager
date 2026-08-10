import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconPicker } from "@/components/ui/icon-picker";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  resourceColor,
  RESOURCE_COLORS,
  RESOURCE_COLOR_KEYS,
  DEFAULT_RESOURCE_COLOR,
  type ResourceColorKey,
} from "@/constants/colors";
import { useEntityIcons } from "@/hooks/useEntityIcons";
import type { PromptRow } from "@/types";

interface TagInfo {
  name: string;
  count: number;
}

/**
 * Radix menus and dialogs both lock `pointer-events` on <body> while open
 * (react-dismissable-layer shares a module-level saved value). Opening a
 * Dialog/AlertDialog synchronously from a menu item's onSelect makes the
 * menu's close cleanup restore the dialog's "none" instead of "", leaving
 * the whole UI dead to clicks. Deferring one tick lets the menu fully
 * unmount (restoring body pointer-events) before the dialog mounts.
 */
function deferMenuDialog(fn: () => void) {
  return () => {
    window.setTimeout(fn, 0);
  };
}

interface TagsPageProps {
  onRefresh: () => void;
  /** Navigate to the Prompts view filtered to this tag. */
  onTagSelect: (tag: string) => void;
}


export function TagsPage({ onRefresh, onTagSelect }: TagsPageProps) {
  const {
    icons: tagIcons,
    colors,
    setIcon: setTagIcon,
    clearIcon: clearTagIcon,
    setColor,
    clearColor,
    load: loadTagIcons,
  } = useEntityIcons("tag");
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [newTags, setNewTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

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
    if (!trimmed || trimmed === oldName) {
      return;
    }
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

  const handleEditTag = async (next: {
    name: string;
    icon: IconName | null;
    color: ResourceColorKey | null;
  }) => {
    const oldName = editingTag;
    if (!oldName) return;
    try {
      if (next.icon !== (tagIcons[oldName] ?? null)) {
        await (next.icon
          ? setTagIcon(oldName, next.icon)
          : clearTagIcon(oldName));
      }
      if (next.color !== (colors[oldName] ?? null)) {
        await (next.color ? setColor(oldName, next.color) : clearColor(oldName));
      }
      if (next.name && next.name !== oldName) {
        // Rename rewrites the tag on every affected prompt (tags are a
        // comma-separated string). Icon/color were applied to the OLD name
        // above, before the rename.
        await handleRenameTag(oldName, next.name);
      }
      await loadPrompts();
      onRefresh();
      await loadTagIcons();
      setEditingTag(null);
    } catch (e) {
      console.error("Failed to edit tag:", e);
      setEditingTag(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="tags"
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
              <Icon name="add" size="sm" />
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
                onSelect={() => onTagSelect(tag.name)}
                onDelete={() => setTagToDelete(tag.name)}
                onEdit={() => setEditingTag(tag.name)}
                icon={tagIcons[tag.name] ?? null}
                colorKey={colors[tag.name] ?? null}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden shadow-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Tag</TableHead>
                  <TableHead className="w-28 text-center">Prompts</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => {
                  const color = resourceColor(colors[tag.name] ?? null);
                  return (
                    <ContextMenu key={tag.name}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          role="button"
                          tabIndex={0}
                          onClick={() => onTagSelect(tag.name)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onTagSelect(tag.name);
                            }
                          }}
                          title={`View prompts tagged "${tag.name}"`}
                          className="group cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}>
                                <Icon name={tagIcons[tag.name] ?? "tags"} size="md" />
                              </span>
                              <span className="text-sm font-medium truncate">{tag.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="w-28 text-center">
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2.5 py-0.5 font-medium text-muted-foreground"
                            >
                              {tag.count} prompt{tag.count !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="w-28 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TagActionsMenu
                              onEdit={() => setEditingTag(tag.name)}
                              onDelete={() => setTagToDelete(tag.name)}
                            />
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-44">
                        <ContextMenuItem onSelect={deferMenuDialog(() => setEditingTag(tag.name))}>
                          <Icon name="edit" size="sm" />
                          Edit
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onSelect={deferMenuDialog(() => setTagToDelete(tag.name))}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Icon name="delete" size="sm" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <PageEmptyState
          icon="tags"
          title={searchQuery ? "No tags found" : "No tags yet"}
          description={searchQuery ? `No tags match "${searchQuery}"` : "Add tags to your prompts to see them here"}
        />
      )}

      <AddTagsModal
        open={isAddModalOpen}
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

      <EntityEditDialog
        open={editingTag !== null}
        entityLabel="Tag"
        currentName={editingTag ?? ""}
        currentIcon={editingTag ? (tagIcons[editingTag] ?? null) : null}
        currentColor={editingTag ? (colors[editingTag] ?? null) : null}
        fallbackIcon="tags"
        existingNames={tags
          .map((t) => t.name)
          .filter((n) => n !== editingTag)}
        onClose={() => setEditingTag(null)}
        onSubmit={handleEditTag}
      />

      <AlertDialog
        open={tagToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTagToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tag &quot;{tagToDelete ?? ""}&quot; from all
              prompts that use it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (tagToDelete) handleDeleteTag(tagToDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

function TagCard({
  tag,
  onSelect,
  onDelete,
  onEdit,
  icon,
  colorKey,
}: {
  tag: TagInfo;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  icon: IconName | null;
  colorKey: ResourceColorKey | null;
}) {
  const color = resourceColor(colorKey);
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          aria-label={`View prompts tagged "${tag.name}"`}
          title={`View prompts tagged "${tag.name}"`}
          className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CardContent className="p-3 flex items-center gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}>
              <Icon name={icon ?? "tags"} size="md" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {tag.name}
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag.count} prompt{tag.count !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <TagActionsMenu onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem onSelect={deferMenuDialog(onEdit)}>
          <Icon name="edit" size="sm" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={deferMenuDialog(onDelete)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Icon name="delete" size="sm" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function TagActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Options"
          aria-label="Options"
          className="h-7 w-7 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100"
        >
          <Icon name="more" size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={deferMenuDialog(onEdit)}>
          <Icon name="edit" size="sm" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={deferMenuDialog(onDelete)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Icon name="delete" size="sm" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddTagsModal({
  open,
  prompts,
  selectedPromptId,
  setSelectedPromptId,
  newTags,
  setNewTags,
  onClose,
  onAdd,
  isLoading,
}: {
  open: boolean;
  prompts: PromptRow[];
  selectedPromptId: number | null;
  setSelectedPromptId: (id: number | null) => void;
  newTags: string;
  setNewTags: (tags: string) => void;
  onClose: () => void;
  onAdd: () => void;
  isLoading: boolean;
}) {
  const selectedPrompt = selectedPromptId
    ? prompts.find((p) => p.id === selectedPromptId)
    : undefined;
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Prompt</Label>
            <Select
              value={selectedPromptId ? String(selectedPromptId) : ""}
              onValueChange={(v) => setSelectedPromptId(v ? Number(v) : null)}
            >
              <SelectTrigger id="prompt-select">
                <SelectValue placeholder="Choose a prompt..." />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={String(prompt.id)}>
                    {prompt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPromptId && (
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedPrompt?.tags?.split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 font-medium text-muted-foreground"
                    >
                      {tag}
                    </Badge>
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
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 font-medium text-muted-foreground"
                      >
                        {trimmed}
                      </Badge>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onAdd} disabled={!selectedPromptId || !newTags.trim() || isLoading}>
            {isLoading ? "Adding..." : "Add Tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageEmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon name={icon} size="xl" className="text-primary" />
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface EntityEditDialogProps {
  open: boolean;
  entityLabel: string;
  currentName: string;
  currentIcon: IconName | null;
  currentColor: ResourceColorKey | null;
  fallbackIcon: IconName;
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (next: {
    name: string;
    icon: IconName | null;
    color: ResourceColorKey | null;
  }) => void | Promise<void>;
}

function EntityEditDialog({
  open,
  entityLabel,
  currentName,
  currentIcon,
  currentColor,
  fallbackIcon,
  existingNames = [],
  onClose,
  onSubmit,
}: EntityEditDialogProps) {
  const [name, setName] = useState(currentName);
  const [icon, setIcon] = useState<IconName | null>(currentIcon);
  const [color, setColor] = useState<ResourceColorKey | null>(currentColor);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset local state whenever the dialog (re)opens for a different entity.
  useEffect(() => {
    if (open) {
      setName(currentName);
      setIcon(currentIcon);
      setColor(currentColor);
      setIconPickerOpen(false);
      setIsSubmitting(false);
    }
  }, [open, currentName, currentIcon, currentColor]);

  const trimmed = name.trim();
  // Case-insensitive duplicate check; currentName is never its own duplicate.
  const isDuplicate =
    trimmed.toLowerCase() !== currentName.toLowerCase() &&
    existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  // A name change is not required — icon-only / color-only edits are saveable.
  const canSubmit = !!trimmed && !isDuplicate && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmed, icon, color });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedColor = color ?? DEFAULT_RESOURCE_COLOR;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {entityLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIconPickerOpen(true)}
                  aria-label={`Choose icon for this ${entityLabel.toLowerCase()}`}
                  className={`h-10 w-10 rounded-lg border-transparent ${RESOURCE_COLORS[selectedColor].bg} ${RESOURCE_COLORS[selectedColor].text}`}
                >
                  <Icon name={icon ?? fallbackIcon} size="md" />
                </Button>
                {icon !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIcon(null)}
                    className="h-7 px-2 text-xs text-muted-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                {RESOURCE_COLOR_KEYS.map((k) => (
                  <Button
                    key={k}
                    type="button"
                    variant="outline"
                    size="icon"
                    title={RESOURCE_COLORS[k].label}
                    aria-label={RESOURCE_COLORS[k].label}
                    onClick={() => setColor((cur) => (cur === k ? null : k))}
                    className={`h-7 w-7 rounded-full border-transparent p-0 transition-transform hover:scale-105 ${RESOURCE_COLORS[k].swatch} ${
                      color === k
                        ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="entity-name-input">{entityLabel} Name</Label>
              <Input
                id="entity-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                autoFocus
              />
              {isDuplicate && (
                <p className="text-sm text-warning">
                  A {entityLabel.toLowerCase()} with this name already exists.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IconPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        value={icon}
        onSelect={setIcon}
        onClear={() => setIcon(null)}
        title={`Choose an icon for this ${entityLabel.toLowerCase()}`}
      />
    </>
  );
}
