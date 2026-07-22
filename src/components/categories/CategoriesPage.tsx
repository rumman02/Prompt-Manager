import { useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCategories } from "@/hooks/useCategories";
import type { CategoryCount } from "@/types";

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
  const { categories, loadCategories, addCategory, deleteCategory } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useMemo(() => {
    loadCategories();
  }, [loadCategories]);

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      setIsAddCategoryModalOpen(false);
      await loadCategories();
    } catch (e) {
      console.error("Failed to add category:", e);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Delete category "${category}"? This will remove the category from all prompts in it.`)) return;
    try {
      await deleteCategory(category);
      await loadCategories();
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
          <Button onClick={() => setIsAddCategoryModalOpen(true)} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Category
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
            placeholder="Search categories..."
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCategories.map((cat) => (
          <CategoryCard
            key={cat.category}
            category={cat}
            onSelect={() => {
              onCategorySelect(cat.category);
              onViewChange("prompts");
            }}
            onDelete={() => handleDeleteCategory(cat.category)}
          />
        ))}
        {filteredCategories.length === 0 && categories.length > 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
            <p className="text-muted-foreground">No categories match "{searchQuery}"</p>
          </div>
        )}
        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium">No categories yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create prompts with categories or add a new category</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setIsAddCategoryModalOpen(true)} className="gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Category
              </Button>
              <Button onClick={onLoadDemo} variant="outline" className="gap-2">
                Load demo prompts
              </Button>
            </div>
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
  onSelect,
  onDelete,
}: {
  category: CategoryCount;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <button
          onClick={onSelect}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{category.category}</div>
            <div className="text-xs text-muted-foreground">
              {category.count} prompt{category.count !== 1 ? "s" : ""}
            </div>
          </div>
        </button>
        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
          title="Delete category"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </CardContent>
    </Card>
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
