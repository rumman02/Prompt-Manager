import { useState, useMemo, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { IconPicker } from "@/components/ui/icon-picker";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  resourceColor,
  RESOURCE_COLORS,
  RESOURCE_COLOR_KEYS,
  DEFAULT_RESOURCE_COLOR,
  type ResourceColorKey,
} from "@/constants/colors";
import { useCategories } from "@/hooks/useCategories";
import { useEntityIcons } from "@/hooks/useEntityIcons";
import type { CategoryCount, PromptRow } from "@/types";

interface CategoriesPageProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onViewChange: (view: "prompts") => void;
  onLoadDemo: () => void;
}

/**
 * Radix menus and dialogs both lock `pointer-events` on <body> while open.
 * Opening a Dialog/AlertDialog synchronously from a menu item's onSelect
 * leaves the menu's close cleanup restoring the dialog's "none" instead of
 * "", deadening the UI after the dialog closes. Deferring one tick lets the
 * menu unmount (restoring body pointer-events) before the dialog mounts.
 */
function deferMenuDialog(fn: () => void) {
  return () => {
    window.setTimeout(fn, 0);
  };
}

export function CategoriesPage({
  selectedCategory,
  onCategorySelect,
  onViewChange,
  onLoadDemo,
}: CategoriesPageProps) {
  const { categories, loadCategories, addCategory, deleteCategory, renameCategory } =
    useCategories();
  const {
    icons: categoryIcons,
    colors,
    load: loadCategoryIcons,
    setIcon: setCategoryIcon,
    clearIcon: clearCategoryIcon,
    setColor,
    clearColor,
  } = useEntityIcons("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // load all prompts once so each card can preview titles in its category
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await invoke<PromptRow[]>("get_prompts");
        if (!cancelled) setPrompts(result);
      } catch (e) {
        console.error("Failed to load prompts for category preview:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categories.length]);

  const filteredCategories = useMemo(() => {
    let filtered = categories.filter((cat) =>
      cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.category.localeCompare(b.category);
      return b.count - a.count;
    });
    return filtered;
  }, [categories, searchQuery, sortBy]);

  const refreshPrompts = useCallback(async () => {
    try {
      const result = await invoke<PromptRow[]>("get_prompts");
      setPrompts(result);
    } catch (e) {
      console.error("Failed to refresh prompts:", e);
    }
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      setIsAddCategoryModalOpen(false);
      await loadCategories();
      await refreshPrompts();
    } catch (e) {
      console.error("Failed to add category:", e);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleEditCategory = async (next: {
    name: string;
    icon: IconName | null;
    color: ResourceColorKey | null;
  }) => {
    const oldName = editingCategory;
    if (!oldName) return;
    try {
      // Apply icon and color to the OLD name BEFORE renaming — the Rust
      // rename_category carries the entity_icons row across to the new name.
      if (next.icon !== (categoryIcons[oldName] ?? null)) {
        await (next.icon
          ? setCategoryIcon(oldName, next.icon)
          : clearCategoryIcon(oldName));
      }
      if (next.color !== (colors[oldName] ?? null)) {
        await (next.color ? setColor(oldName, next.color) : clearColor(oldName));
      }
      if (next.name && next.name !== oldName) {
        await renameCategory(oldName, next.name);
      }
      await loadCategories();
      await refreshPrompts();
      await loadCategoryIcons();
      setEditingCategory(null);
    } catch (e) {
      console.error("Failed to edit category:", e);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      await deleteCategory(category);
      await loadCategories();
      await refreshPrompts();
    } catch (e) {
      console.error("Failed to delete category:", e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="categories"
        title="Categories"
        subtitle={`${filteredCategories.length} categor${filteredCategories.length !== 1 ? "ies" : "y"}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search categories..."
            />
            <Button onClick={() => setIsAddCategoryModalOpen(true)} className="gap-2">
              <Icon name="add" size="sm" />
              Add Category
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCategories.map((cat) => (
          <CategoryCard
            key={cat.category}
            category={cat}
            prompts={prompts}
            onSelect={() => {
              onCategorySelect(cat.category);
              onViewChange("prompts");
            }}
            onDelete={() => setCategoryToDelete(cat.category)}
            onEdit={() => setEditingCategory(cat.category)}
            icon={categoryIcons[cat.category] ?? null}
            colorKey={colors[cat.category] ?? null}
          />
        ))}
        {filteredCategories.length === 0 && categories.length > 0 && (
          <div className="col-span-full">
            <PageEmptyState
              icon="categories"
              title={`No categories match "${searchQuery}"`}
              description=""
            />
          </div>
        )}
        {categories.length === 0 && (
          <div className="col-span-full">
            <PageEmptyState
              icon="categories"
              title="No categories yet"
              description="Create prompts with categories or add a new category"
            />
          </div>
        )}
      </div>

      <AddCategoryModal
        open={isAddCategoryModalOpen}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setNewCategoryName("");
        }}
        onAdd={handleAddCategory}
        isAdding={isAddingCategory}
        categories={categories}
      />

      <EntityEditDialog
        open={editingCategory !== null}
        entityLabel="Category"
        currentName={editingCategory ?? ""}
        currentIcon={editingCategory ? (categoryIcons[editingCategory] ?? null) : null}
        currentColor={editingCategory ? (colors[editingCategory] ?? null) : null}
        fallbackIcon="categories"
        existingNames={categories
          .map((c) => c.category)
          .filter((c) => c !== editingCategory)}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleEditCategory}
      />

      <AlertDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{categoryToDelete ?? ""}&quot; from all
              prompts in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (categoryToDelete) handleDeleteCategory(categoryToDelete);
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

function CategoryCard({
  category,
  prompts,
  onSelect,
  onDelete,
  onEdit,
  icon,
  colorKey,
}: {
  category: CategoryCount;
  prompts: PromptRow[];
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  icon: IconName | null;
  colorKey: ResourceColorKey | null;
}) {
  const color = resourceColor(colorKey);
  const previewTitles = useMemo(
    () =>
      prompts
        .filter((p) => p.category === category.category)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 3)
        .map((p) => p.title),
    [prompts, category.category],
  );

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
          aria-label={`View ${category.category} prompts`}
          title={`View ${category.category} prompts`}
          className="group relative cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CardContent className="p-4 space-y-3">
            {/* row 1: icon + name + actions */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}
              >
                <Icon name={icon ?? "categories"} size="md" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {category.category}
                </div>
              </div>

              {/* ⋯ actions menu — fades in on hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Options"
                    aria-label={`Options for ${category.category}`}
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="more" size="md" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44"
                  // Stop the click on the DOM element, not the custom
                  // menu.itemSelect event, so the card's navigate onClick
                  // doesn't fire through the portal.
                  onClick={(e) => e.stopPropagation()}
                >
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
            </div>

            {/* row 2: pill badge with count */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 font-medium text-muted-foreground"
              >
                {category.count} prompt{category.count !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* row 3: preview of prompt titles in this category */}
            {previewTitles.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/60">
                {previewTitles.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    <span className="truncate">{title}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-44"
        onClick={(e) => e.stopPropagation()}
      >
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

function AddCategoryModal({
  open,
  newCategoryName,
  setNewCategoryName,
  onClose,
  onAdd,
  isAdding,
  categories,
}: {
  open: boolean;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onClose: () => void;
  onAdd: () => void;
  isAdding: boolean;
  categories: CategoryCount[];
}) {
  const duplicate = categories.some(
    (c) => c.category.toLowerCase() === newCategoryName.trim().toLowerCase()
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="category-name">Category Name</Label>
          <Input
            id="category-name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Writing, Coding, Marketing..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCategoryName.trim()) onAdd();
            }}
            autoFocus
          />
          {duplicate && (
            <p className="text-sm text-warning">
              A category with this name already exists.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={!newCategoryName.trim() || isAdding || duplicate}
          >
            {isAdding ? "Adding..." : "Add Category"}
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
