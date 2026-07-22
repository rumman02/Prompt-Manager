import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar, type ViewType } from "@/components/sidebar";
import { Header } from "@/components/layout";
import { StatsCards } from "@/components/stats-cards";
import { PromptList } from "@/components/prompts/PromptList";
import { CategoryChart } from "@/components/category-chart";
import { PromptEditorPage, type PromptFormData } from "@/components/prompts/PromptEditorPage";
import { PromptViewer } from "@/components/prompts/PromptViewer";
import { SearchBar } from "@/components/search-bar";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TagsPage } from "@/components/tags/TagsPage";
import { TrashPage } from "@/components/trash/TrashPage";
import { CategoriesPage } from "@/components/categories/CategoriesPage";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import type { PromptRow, CategoryCount } from "@/types";

function AppContent() {
  const { settings } = useSettings();
  const views: ViewType[] = ["dashboard", "prompts", "categories", "tags", "trash", "settings"];
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
  const [isEditorPageOpen, setIsEditorPageOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptRow | null>(null);
  const [previousView, setPreviousView] = useState<ViewType>("prompts");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const handleToggleFavorite = async (id: number) => {
    try {
      await invoke("toggle_favorite", { id });
      await refresh();
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  };

  const handleLoadDemoPrompts = async () => {
    try {
      await invoke("seed_demo_prompts");
      await refresh();
    } catch (e) {
      console.error("Failed to load demo prompts:", e);
    }
  };

  // Auto-purge expired trash on app load
  const purgeExpiredTrash = useCallback(async () => {
    try {
      const days = settings.trashTimeout;
      const unit = settings.trashTimeoutUnit;
      let daysNumber = days;
      if (unit === "weeks") daysNumber = days * 7;
      if (unit === "months") daysNumber = days * 30;
      const purged = await invoke<number>("purge_expired_prompts", { days: daysNumber });
      if (purged > 0) {
        console.log(`Purged ${purged} expired prompts from trash`);
      }
    } catch (e) {
      console.error("Failed to purge expired trash:", e);
    }
  }, [settings.trashTimeout, settings.trashTimeoutUnit]);

  useEffect(() => {
    refresh();
    purgeExpiredTrash();
  }, [refresh, purgeExpiredTrash]);

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
    setPreviousView(activeView);
    setIsEditorPageOpen(true);
  };

  const handleEditPrompt = (prompt: PromptRow) => {
    setEditingPrompt(prompt);
    setSelectedPrompt(null);
    setPreviousView(activeView);
    setIsEditorPageOpen(true);
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

  const handleSavePrompt = async (data: PromptFormData) => {
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
      setIsEditorPageOpen(false);
      setEditingPrompt(null);
      await refresh();
    } catch (e) {
      console.error("Failed to save prompt:", e);
    }
  };

  const handleEditorClose = () => {
    setIsEditorPageOpen(false);
    setEditingPrompt(null);
    setActiveView(previousView);
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
        <Header
          searchQuery={searchQuery}
          onSearch={handleSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreatePrompt={handleCreatePrompt}
        />

        <main className="flex-1 overflow-auto p-6">
          {isEditorPageOpen && (
            <PromptEditorPage
              prompt={editingPrompt}
              categories={categories.map((c) => c.category)}
              onBack={handleEditorClose}
              onSave={handleSavePrompt}
            />
          )}

          {!isEditorPageOpen && activeView === "dashboard" && (
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
                    onLoadDemo={handleLoadDemoPrompts}
                  />
                </div>
                <div>
                  <CategoryChart categories={categories} />
                </div>
              </div>
            </div>
          )}

          {!isEditorPageOpen && activeView === "prompts" && (
            <PromptList
              prompts={filteredPrompts}
              viewMode={viewMode}
              onSelect={setSelectedPrompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              onToggleFavorite={handleToggleFavorite}
              showHeader
              headerTitle={selectedCategory ? `Prompts: ${selectedCategory}` : "All Prompts"}
              onLoadDemo={handleLoadDemoPrompts}
            />
          )}

          {!isEditorPageOpen && activeView === "categories" && (
            <CategoriesPage
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onViewChange={setActiveView}
              onLoadDemo={handleLoadDemoPrompts}
            />
          )}

          {!isEditorPageOpen && activeView === "tags" && (
            <TagsPage onRefresh={refresh} />
          )}

          {!isEditorPageOpen && activeView === "trash" && (
            <TrashPage onRefresh={refresh} />
          )}

          {!isEditorPageOpen && activeView === "settings" && <SettingsPage />}
        </main>
      </div>

      <PromptViewer
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onEdit={handleEditPrompt}
        onDelete={handleDeletePrompt}
        onToggleFavorite={handleToggleFavorite}
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
