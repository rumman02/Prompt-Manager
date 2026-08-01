import { useState, useMemo, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu";
import { EntityEditDialog } from "@/components/ui/entity-edit-dialog";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { resourceColor, type ResourceColorKey } from "@/constants/colors";
import { useCategories } from "@/hooks/useCategories";
import { useEntityIcons } from "@/hooks/useEntityIcons";
import type { CategoryCount, PromptRow } from "@/types";

interface CategoriesPageProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onViewChange: (view: "prompts") => void;
  onLoadDemo: () => void;
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
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

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

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenamingCategory(null);
      return;
    }
    try {
      await renameCategory(oldName, trimmed);
      await loadCategories();
      await refreshPrompts();
      setRenamingCategory(null);
    } catch (e) {
      console.error("Failed to rename category:", e);
      setRenamingCategory(null);
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
    if (!confirm(`Delete category "${category}"? This will remove the category from all prompts in it.`)) return;
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
            onRename={(name) => setRenamingCategory(name)}
            onDelete={() => handleDeleteCategory(cat.category)}
            onEdit={() => setEditingCategory(cat.category)}
            icon={categoryIcons[cat.category] ?? null}
            colorKey={colors[cat.category] ?? null}
          />
        ))}
        {filteredCategories.length === 0 && categories.length > 0 && (
          <div className="col-span-full">
            <EmptyState
              icon="categories"
              title={`No categories match "${searchQuery}"`}
              description=""
            />
          </div>
        )}
        {categories.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon="categories"
              title="No categories yet"
              description="Create prompts with categories or add a new category"
            />
          </div>
        )}
      </div>

      {renamingCategory !== null && (
        <RenameDialog
          open
          currentName={renamingCategory}
          entityLabel="Category"
          existingNames={categories
            .map((c) => c.category)
            .filter((c) => c !== renamingCategory)}
          onClose={() => setRenamingCategory(null)}
          onSubmit={(newName) => handleRenameCategory(renamingCategory, newName)}
        />
      )}

      {editingCategory !== null && (
        <EntityEditDialog
          open
          entityLabel="Category"
          currentName={editingCategory}
          currentIcon={categoryIcons[editingCategory] ?? null}
          currentColor={colors[editingCategory] ?? null}
          fallbackIcon="categories"
          existingNames={categories
            .map((c) => c.category)
            .filter((c) => c !== editingCategory)}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleEditCategory}
        />
      )}

      {isAddCategoryModalOpen && (
        <AddCategoryModal
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
      )}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  prompts,
  onSelect,
  onRename,
  onDelete,
  onEdit,
  icon,
  colorKey,
}: {
  category: CategoryCount;
  prompts: PromptRow[];
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  icon: IconName | null;
  colorKey: ResourceColorKey | null;
}) {
  const color = resourceColor(colorKey);
  const menuItems: ContextMenuItem[] = [
    { label: "Edit", icon: "edit", onClick: onEdit },
    { label: "Rename", icon: "edit", onClick: () => onRename(category.category) },
    { label: "Delete", icon: "delete", onClick: onDelete, destructive: true },
  ];
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
    <ContextMenu items={menuItems}>
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
            <div onClick={(e) => e.stopPropagation()}>
              <ActionsMenu items={menuItems} />
            </div>
          </div>

          {/* row 2: pill badge with count */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
              {category.count} prompt{category.count !== 1 ? "s" : ""}
            </span>
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
    </ContextMenu>
  );
}

function AddCategoryModal({
  newCategoryName,
  setNewCategoryName,
  onClose,
  onAdd,
  isAdding,
  categories,
}: {
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onClose: () => void;
  onAdd: () => void;
  isAdding: boolean;
  categories: CategoryCount[];
}) {
  return (
    <Modal open={true} onClose={onClose} title="Add Category" footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onAdd}
          disabled={
            !newCategoryName.trim() ||
            isAdding ||
            categories.some((c) => c.category.toLowerCase() === newCategoryName.trim().toLowerCase())
          }
        >
          {isAdding ? "Adding..." : "Add Category"}
        </Button>
      </>
    }>
      <div className="space-y-2">
        <label htmlFor="category-name" className="text-sm font-medium">
          Category Name
        </label>
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
        {categories.some((c) => c.category.toLowerCase() === newCategoryName.trim().toLowerCase()) && (
          <p className="text-sm text-warning">A category with this name already exists.</p>
        )}
      </div>
    </Modal>
  );
}
