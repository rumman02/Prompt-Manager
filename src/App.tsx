import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar, type ViewType } from "@/components/sidebar";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromptList } from "@/components/prompts/PromptList";
import { PromptEditorPage, type PromptFormData } from "@/components/prompts/PromptEditorPage";
import { PromptViewer } from "@/components/prompts/PromptViewer";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TagsPage } from "@/components/tags/TagsPage";
import { TrashPage } from "@/components/trash/TrashPage";
import { CategoriesPage } from "@/components/categories/CategoriesPage";
import { AgentsPage } from "@/components/agents";
import { SkillsPage } from "@/components/skills";
import { FavoritesPage } from "@/components/favorites";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { VaultProvider, useVault } from "@/contexts/VaultContext";
import { VaultSetupScreen } from "@/components/vault";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster, toast } from "sonner";
import type { PromptRow, CategoryCount } from "@/types";

function AppContent() {
  const { settings } = useSettings();
  const views: ViewType[] = ["dashboard", "prompts", "agents", "skills", "favorites", "categories", "tags", "trash", "settings"];
  const initialView = views.includes(settings.landingPage) ? settings.landingPage : "dashboard";

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalSkills: 0,
    totalPrompts: 0,
    totalCategories: 0,
    favoritesCount: 0,
    tagsCount: 0,
    trashCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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
      const [totalAgents, totalSkills, totalPrompts, totalCategories, favoritesCount, tagsCount, trashCount] = await Promise.all([
        invoke<number>("get_agents_count"),
        invoke<number>("get_skills_count"),
        invoke<number>("get_prompts_count"),
        invoke<number>("get_categories_count"),
        invoke<number>("get_favorites_count"),
        invoke<number>("get_tags_count"),
        invoke<number>("get_trash_count"),
      ]);
      setStats({ totalAgents, totalSkills, totalPrompts, totalCategories, favoritesCount, tagsCount, trashCount });
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
    setSelectedTag(null);
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

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedCategory(null);
    refresh();
    setActiveView("prompts");
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

  const handleDuplicatePrompt = async (id: number) => {
    try {
      await invoke("duplicate_prompt", { id });
      await refresh();
    } catch (e) {
      console.error("Failed to duplicate prompt:", e);
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
          icon: data.icon || null,
        });
      } else {
        await invoke("create_prompt", {
          title: data.title,
          content: data.content,
          category: data.category || null,
          tags: data.tags || null,
          description: data.description || null,
          icon: data.icon || null,
        });
      }
      if (editingPrompt) {
        // Update: stay on the editor so the user can keep working. A success
        // toast confirms the save; the window only closes via Cancel/Back.
        toast.success("Prompt updated");
      } else {
        // Create: close the editor and return to the prompt list.
        setIsEditorPageOpen(false);
        setEditingPrompt(null);
      }
      await refresh();
    } catch (e) {
      // Re-throw so the editor page can surface the failure as an inline
      // error banner — a silent console.error-only handler is what made
      // "clicking Create Prompt does nothing" impossible to diagnose.
      console.error("Failed to save prompt:", e);
      throw e;
    }
  };

  const handleEditorClose = () => {
    setIsEditorPageOpen(false);
    setEditingPrompt(null);
    setActiveView(previousView);
  };

  const filteredPrompts = (() => {
    let result = prompts;
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (selectedTag) {
      result = result.filter((p) =>
        p.tags
          ?.split(",")
          .map((t) => t.trim())
          .includes(selectedTag),
      );
    }
    return result;
  })();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-secondary/30">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        counts={{
          prompts: stats.totalPrompts,
          agents: stats.totalAgents,
          skills: stats.totalSkills,
          favorites: stats.favoritesCount,
          categories: stats.totalCategories,
          tags: stats.tagsCount,
          trash: stats.trashCount,
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {isEditorPageOpen && (
            <PromptEditorPage
              prompt={editingPrompt}
              categories={categories.map((c) => c.category)}
              onBack={handleEditorClose}
              onSave={handleSavePrompt}
            />
          )}

          {!isEditorPageOpen && activeView === "dashboard" && (
            <div className="flex flex-col h-full">
              <PageHeader
                icon="dashboard"
                title="Dashboard"
                subtitle="Overview of your prompts"
              />
              <div className="flex-1 overflow-auto p-6">
                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <StatsCards stats={stats} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!isEditorPageOpen && activeView === "prompts" && (
            <PromptList
              prompts={filteredPrompts}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelect={setSelectedPrompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              onDuplicate={handleDuplicatePrompt}
              onToggleFavorite={handleToggleFavorite}
              showHeader
              headerTitle={
                selectedTag
                  ? `Prompts tagged "${selectedTag}"`
                  : selectedCategory
                    ? `Prompts: ${selectedCategory}`
                    : "Prompts"
              }
              headerSubtitle={`${filteredPrompts.length} prompt${filteredPrompts.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              onCreatePrompt={handleCreatePrompt}
            />
          )}

          {!isEditorPageOpen && activeView === "agents" && (
            <AgentsPage />
          )}

          {!isEditorPageOpen && activeView === "skills" && (
            <SkillsPage />
          )}

          {!isEditorPageOpen && activeView === "favorites" && (
            <FavoritesPage
              prompts={filteredPrompts}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelect={setSelectedPrompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              onDuplicate={handleDuplicatePrompt}
              onToggleFavorite={handleToggleFavorite}
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
            <TagsPage onRefresh={refresh} onTagSelect={handleTagSelect} />
          )}

          {!isEditorPageOpen && activeView === "trash" && (
            <TrashPage onRefresh={refresh} />
          )}

          {!isEditorPageOpen && activeView === "settings" && (
            <SettingsPage />
          )}
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

/**
 * Gate: waits for the vault status, shows the first-run setup screen when no
 * vault is active, otherwise renders the app. Toaster lives here so toasts
 * also work on the setup screen.
 */
function AppGate() {
  const { loading, needsSetup, activeVault } = useVault();
  const { settings } = useSettings();

  return (
    <>
      <Toaster
        theme={settings.theme === "dark" ? "dark" : "light"}
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: "14px",
            backdropFilter: "blur(20px)",
            background: settings.theme === "dark" ? "rgba(44, 44, 46, 0.9)" : "rgba(255, 255, 255, 0.9)",
            border: `1px solid ${settings.theme === "dark" ? "rgba(72, 72, 74, 0.5)" : "rgba(210, 210, 215, 0.5)"}`,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.16)",
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          },
        }}
      />
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-secondary/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : needsSetup || activeVault === null ? (
        <VaultSetupScreen />
      ) : (
        <AppContent />
      )}
    </>
  );
}

export function App() {
  return (
    <VaultProvider>
      <SettingsProvider>
        <TooltipProvider>
          <AppGate />
        </TooltipProvider>
      </SettingsProvider>
    </VaultProvider>
  );
}
