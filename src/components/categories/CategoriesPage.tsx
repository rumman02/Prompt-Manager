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
import { resourceColor } from "@/constants/colors";
import { useCategories } from "@/hooks/useCategories";
import type { CategoryCount, PromptRow } from "@/types";

interface CategoriesPageProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onViewChange: (view: "prompts") => void;
  onLoadDemo: () => void;
}

/* ─── color — shared resourceColor() from constants/colors ─── */

export function CategoriesPage({
  selectedCategory,
  onCategorySelect,
  onViewChange,
  onLoadDemo,
}: CategoriesPageProps) {
  const { categories, loadCategories, addCategory, deleteCategory, renameCategory } =
    useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [prompts, setPrompts] = useState<PromptRow[]>([]);

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
    if (!trimmed || trimmed === oldName) return;
    try {
      await renameCategory(oldName, trimmed);
      await loadCategories();
      await refreshPrompts();
    } catch (e) {
      console.error("Failed to rename category:", e);
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
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        }
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
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
            onRename={(name) => {
              const newName = prompt(`Rename category "${name}" to:`, name);
              if (newName?.trim()) handleRenameCategory(name, newName.trim());
            }}
            onDelete={() => handleDeleteCategory(cat.category)}
          />
        ))}
        {filteredCategories.length === 0 && categories.length > 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={
                <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              }
              title={`No categories match "${searchQuery}"`}
              description=""
            />
          </div>
        )}
        {categories.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={
                <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              }
              title="No categories yet"
              description="Create prompts with categories or add a new category"
            />
          </div>
        )}
      </div>

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
}: {
  category: CategoryCount;
  prompts: PromptRow[];
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const color = resourceColor(category.category);
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
    <Card className="group relative transition-all hover:border-primary/40 hover:shadow-macos-button hover:bg-muted/20">
      <CardContent className="p-4 space-y-3">
        {/* row 1: icon + name + actions */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <button
            onClick={onSelect}
            className="min-w-0 flex-1 text-left"
            title={`View ${category.category} prompts`}
          >
            <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {category.category}
            </div>
          </button>

          {/* ⋯ actions menu — fades in on hover */}
          <ActionsMenu
            items={[
              {
                label: "Rename",
                icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
                onClick: () => onRename(category.category),
              },
              {
                label: "Delete",
                icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
                onClick: onDelete,
                destructive: true,
              },
            ]}
          />
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
  );
}

/* ─── per-card ⋯ actions menu — uses shared ActionsMenu ─── */

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
