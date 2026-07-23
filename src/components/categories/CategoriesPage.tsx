import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useCategories";
import type { CategoryCount, PromptRow } from "@/types";

interface CategoriesPageProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onViewChange: (view: "prompts") => void;
  onLoadDemo: () => void;
}

/* ─── color-coded icon backgrounds per category ─── */
const CATEGORY_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400" },
  { bg: "bg-violet-500/10", text: "text-violet-500 dark:text-violet-400" },
  { bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
  { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400" },
  { bg: "bg-rose-500/10", text: "text-rose-500 dark:text-rose-400" },
  { bg: "bg-cyan-500/10", text: "text-cyan-500 dark:text-cyan-400" },
  { bg: "bg-pink-500/10", text: "text-pink-500 dark:text-pink-400" },
  { bg: "bg-teal-500/10", text: "text-teal-500 dark:text-teal-400" },
  { bg: "bg-orange-500/10", text: "text-orange-500 dark:text-orange-400" },
  { bg: "bg-indigo-500/10", text: "text-indigo-500 dark:text-indigo-400" },
];

function categoryColor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">No categories match "{searchQuery}"</p>
              </CardContent>
            </Card>
          </div>
        )}
        {categories.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No categories yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create prompts with categories or add a new category</p>
              </CardContent>
            </Card>
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
  const color = categoryColor(category.category);
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
    <Card className="group relative transition-all hover:border-primary/40 hover:shadow-md hover:bg-muted/20">
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

          {/* ⋯ actions menu — fades in on hover, like All Prompts row actions */}
          <CategoryActionsMenu
            onRename={() => onRename(category.category)}
            onDelete={onDelete}
          />
        </div>

        {/* row 2: pill badge with count */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
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

/* ─── per-card ⋯ actions menu (edit / delete) ─── */

function CategoryActionsMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stop: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
        title="Category options"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          onMouseDown={stop}
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <button
            onClick={(e) => {
              stop(e);
              setOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted focus:bg-muted transition-colors"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Rename
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={(e) => {
              stop(e);
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-card shadow-2xl border">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Add Category</h2>
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
              <p className="text-sm text-amber-600">A category with this name already exists.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
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
        </div>
      </div>
    </div>
  );
}
