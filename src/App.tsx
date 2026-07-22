import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar, type ViewType } from "@/components/sidebar";
import { StatsCards } from "@/components/stats-cards";
import { PromptList } from "@/components/prompt-list";
import { CategoryChart } from "@/components/category-chart";
import { PromptEditor } from "@/components/prompt-editor";
import { PromptViewer } from "@/components/prompt-viewer";
import { SearchBar } from "@/components/search-bar";
import { SettingsPage } from "@/components/settings-page";
import { TagsPage } from "@/components/tags-page";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PromptRow, CategoryCount } from "@/types";

function AppContent() {
  const { settings } = useSettings();
  const views: ViewType[] = ["dashboard", "prompts", "categories", "tags", "settings"];
  const initialView = views.includes(settings.landingPage) ? settings.landingPage : "dashboard";

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalCategories: 0,
    totalTags: 0,
    activePrompts: 0,
    avgTokensPerPrompt: 0,
    favoritesCount: 0,
    newThisWeek: 0,
    popularCategory: null as string | null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptRow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categorySortBy, setCategorySortBy] = useState<"name" | "count">("name");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const loadPrompts = useCallback(async () => {
    try {
      const result = await invoke<PromptRow[]>("get_prompts");
      setPrompts(result);
    } catch (e) {
      console.error("Failed to load prompts:", e);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [totalPrompts, totalCategories, totalTags, activePrompts, avgTokensPerPrompt, favoritesCount, newThisWeek, popularCategory] = await Promise.all([
        invoke<number>("get_prompts_count"),
        invoke<number>("get_categories_count"),
        invoke<number>("get_tags_count"),
        invoke<number>("get_active_prompts_count"),
        invoke<number>("get_avg_tokens_per_prompt"),
        invoke<number>("get_favorites_count"),
        invoke<number>("get_new_this_week_count"),
        invoke<string | null>("get_most_popular_category"),
      ]);
      setStats({ totalPrompts, totalCategories, totalTags, activePrompts, avgTokensPerPrompt, favoritesCount, newThisWeek, popularCategory });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, []);

  const handleToggleFavorite = async (id: number) => {
    try {
      await invoke("toggle_favorite", { id });
      await refresh();
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  };

  const loadCategories = useCallback(async () => {
    try {
      const result = await invoke<CategoryCount[]>("get_category_counts");
      setCategories(result);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadPrompts(), loadStats(), loadCategories()]);
  }, [loadPrompts, loadStats, loadCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      await invoke("add_category", { category: newCategoryName.trim() });
      setNewCategoryName("");
      setIsAddCategoryModalOpen(false);
      await refresh();
    } catch (e) {
      console.error("Failed to add category:", e);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Delete category "${category}"? This will remove the category from all prompts in it.`)) return;
    try {
      await invoke("delete_category", { category });
      await refresh();
    } catch (e) {
      console.error("Failed to delete category:", e);
    }
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let filtered = categories.filter((cat) =>
      cat.category.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (categorySortBy === "name") {
        return a.category.localeCompare(b.category);
      }
      return b.count - a.count;
    });
    return filtered;
  }, [categories, categorySearchQuery, categorySortBy]);

  const handleLoadDemoPrompts = async () => {
    try {
      await invoke("seed_demo_prompts");
      await refresh();
    } catch (e) {
      console.error("Failed to load demo prompts:", e);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleLoadDemo = () => {
      handleLoadDemoPrompts();
    };
    window.addEventListener("load-demo-prompts", handleLoadDemo);
    return () => window.removeEventListener("load-demo-prompts", handleLoadDemo);
  }, [handleLoadDemoPrompts]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const result = await invoke<PromptRow[]>("search_prompts", { query });
        setPrompts(result);
      } catch (e) {
        console.error("Search failed:", e);
      }
    } else {
      refresh();
    }
  };

  const handleCategorySelect = async (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      try {
        const result = await invoke<PromptRow[]>("get_prompts_by_category", { category });
        setPrompts(result);
      } catch (e) {
        console.error("Failed to load category:", e);
      }
    } else {
      refresh();
    }
  };

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleEditPrompt = (prompt: PromptRow) => {
    setEditingPrompt(prompt);
    setSelectedPrompt(null);
    setIsEditorOpen(true);
  };

  const handleDeletePrompt = async (id: number) => {
    try {
      await invoke("delete_prompt", { id });
      if (selectedPrompt?.id === id) setSelectedPrompt(null);
      await refresh();
    } catch (e) {
      console.error("Failed to delete prompt:", e);
    }
  };

  const handleSavePrompt = async (data: {
    title: string;
    content: string;
    category: string;
    tags: string;
    description: string;
  }) => {
    try {
      if (editingPrompt) {
        await invoke("update_prompt", {
          id: editingPrompt.id,
          title: data.title,
          content: data.content,
          category: data.category || null,
          tags: data.tags || null,
          description: data.description || null,
        });
      } else {
        await invoke("create_prompt", {
          title: data.title,
          content: data.content,
          category: data.category || null,
          tags: data.tags || null,
          description: data.description || null,
        });
      }
      setIsEditorOpen(false);
      setEditingPrompt(null);
      await refresh();
    } catch (e) {
      console.error("Failed to save prompt:", e);
    }
  };

  const filteredPrompts = selectedCategory
    ? prompts.filter((p) => p.category === selectedCategory)
    : prompts;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onCreatePrompt={handleCreatePrompt}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
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
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Prompt Manager</h1>
              <p className="text-xs text-muted-foreground">Manage your AI prompts efficiently</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search prompts..."
            />
            <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grid
              </button>
            </div>
            <button
              onClick={handleCreatePrompt}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Prompt
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeView === "dashboard" && (
            <div className="space-y-6">
              <StatsCards stats={stats} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PromptList
                    prompts={filteredPrompts.slice(0, 8)}
                    viewMode={viewMode}
                    onSelect={setSelectedPrompt}
                    onEdit={handleEditPrompt}
                    onDelete={handleDeletePrompt}
                    onToggleFavorite={handleToggleFavorite}
                    showHeader
                    headerTitle="Recent Prompts"
                  />
                </div>
                <div>
                  <CategoryChart categories={categories} />
                </div>
              </div>
            </div>
          )}

          {activeView === "prompts" && (
            <PromptList
              prompts={filteredPrompts}
              viewMode={viewMode}
              onSelect={setSelectedPrompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              onToggleFavorite={handleToggleFavorite}
              showHeader
              headerTitle={selectedCategory ? `Prompts: ${selectedCategory}` : "All Prompts"}
            />
          )}

          {activeView === "categories" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredCategories.length} categor{filteredCategories.length !== 1 ? "ies" : "y"}
                    {categorySearchQuery && ` matching "${categorySearchQuery}"`}
                  </p>
                </div>
                <Button onClick={() => setIsAddCategoryModalOpen(true)} className="gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Category
                </Button>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <div className="flex rounded-md border bg-muted/30 p-1">
                    <button
                      onClick={() => setCategorySortBy("name")}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        categorySortBy === "name"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => setCategorySortBy("count")}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        categorySortBy === "count"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Count
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCategories.map((cat) => (
                  <Card
                    key={cat.category}
                    className="group transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat.category);
                          setActiveView("prompts");
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{cat.category}</div>
                          <div className="text-xs text-muted-foreground">
                            {cat.count} prompt{cat.count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.category)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
                        title="Delete category"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </CardContent>
                  </Card>
                ))}
                {filteredCategories.length === 0 && categories.length > 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
                    <p className="text-muted-foreground">No categories match "{categorySearchQuery}"</p>
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
                      <Button onClick={handleLoadDemoPrompts} variant="outline" className="gap-2">
                        Load demo prompts
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Category Modal */}
              {isAddCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => {
                      setIsAddCategoryModalOpen(false);
                      setNewCategoryName("");
                    }}
                  />
                  <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-card shadow-2xl border">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <h2 className="text-lg font-semibold">Add Category</h2>
                      <button
                        onClick={() => {
                          setIsAddCategoryModalOpen(false);
                          setNewCategoryName("");
                        }}
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
                            if (e.key === "Enter" && newCategoryName.trim()) {
                              handleAddCategory();
                            }
                          }}
                          autoFocus
                        />
                        {categories.some((c) => c.category.toLowerCase() === newCategoryName.trim().toLowerCase()) && (
                          <p className="text-sm text-amber-600">A category with this name already exists.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddCategoryModalOpen(false);
                          setNewCategoryName("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddCategory}
                        disabled={
                          !newCategoryName.trim() ||
                          isAddingCategory ||
                          categories.some((c) => c.category.toLowerCase() === newCategoryName.trim().toLowerCase())
                        }
                      >
                        {isAddingCategory ? "Adding..." : "Add Category"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "tags" && (
            <TagsPage onRefresh={refresh} />
          )}

          {activeView === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Prompt Viewer Drawer */}
      <PromptViewer
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onEdit={handleEditPrompt}
        onDelete={handleDeletePrompt}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Prompt Editor Modal */}
      <PromptEditor
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        prompt={editingPrompt}
        categories={categories.map((c) => c.category)}
      />
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
