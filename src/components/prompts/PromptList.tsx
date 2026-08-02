import { useMemo, useState, type ReactNode } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListTable } from "./PromptListTable";
import { EmptyPromptsState } from "./EmptyPromptsState";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import type { PromptRow } from "@/types";

interface PromptListProps {
  prompts: PromptRow[];
  viewMode: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  showHeader?: boolean;
  headerTitle?: string;
  headerIcon?: ReactNode;
  headerSubtitle?: string;
  backButton?: { label: string; onClick: () => void };
  onLoadDemo?: () => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onCreatePrompt?: () => void;
  autoFocusSearch?: boolean;
  onSearchFocused?: () => void;
}

export function PromptList({
  prompts,
  viewMode,
  onViewModeChange,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  showHeader,
  headerTitle,
  headerIcon,
  headerSubtitle,
  backButton,
  onLoadDemo,
  searchQuery,
  onSearch,
  onCreatePrompt,
  autoFocusSearch,
  onSearchFocused,
}: PromptListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Category options derived from the prompts actually passed in.
  const categoryOptions = useMemo<{ value: string; label: string }[]>(() => {
    const seen = new Set<string>();
    const categories: string[] = [];
    for (const prompt of prompts) {
      const category = prompt.category?.trim();
      if (category && !seen.has(category)) {
        seen.add(category);
        categories.push(category);
      }
    }
    categories.sort((a, b) => a.localeCompare(b));
    return [
      { value: "all", label: "All categories" },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [prompts]);

  const visiblePrompts = useMemo(() => {
    if (categoryFilter === "all") return prompts;
    return prompts.filter((prompt) => prompt.category?.trim() === categoryFilter);
  }, [prompts, categoryFilter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {showHeader && headerTitle && (
        <PageHeader
          icon="prompts"
          title={headerTitle}
          subtitle={headerSubtitle ?? "Browse your prompts"}
          backButton={backButton}
          actions={
            (onSearch || onCreatePrompt || onViewModeChange) ? (
              <div className="flex items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onViewModeChange && (
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => onViewModeChange(v === "grid" ? "grid" : "list")}
                    className="inline-flex"
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="list" className="h-7 px-3 text-xs">
                        List
                      </TabsTrigger>
                      <TabsTrigger value="grid" className="h-7 px-3 text-xs">
                        Grid
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                {onSearch && (
                  <SearchBar
                    value={searchQuery ?? ""}
                    onChange={onSearch}
                    placeholder="Search prompts..."
                    autoFocus={autoFocusSearch}
                    onFocus={onSearchFocused}
                  />
                )}
                {onCreatePrompt && (
                  <Button onClick={onCreatePrompt} className="gap-2">
                    <Icon name="add" size="sm" />
                    Add Prompt
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
      )}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        {prompts.length === 0 ? (
          <EmptyPromptsState
            icon="prompts"
            title="No prompts yet"
            description="Create your first prompt to get started."
            onLoadDemo={onLoadDemo}
          />
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={visiblePrompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <PromptListTable
            prompts={visiblePrompts}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}
