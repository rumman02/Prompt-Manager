import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Stats {
  totalPrompts: number;
  totalCategories: number;
  totalTags: number;
  activePrompts: number;
  avgTokensPerPrompt: number;
  favoritesCount: number;
  newThisWeek: number;
  popularCategory: string | null;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    totalPrompts: 0,
    totalCategories: 0,
    totalTags: 0,
    activePrompts: 0,
    avgTokensPerPrompt: 0,
    favoritesCount: 0,
    newThisWeek: 0,
    popularCategory: null,
  });

  const loadStats = useCallback(async () => {
    try {
      const [
        totalPrompts,
        totalCategories,
        totalTags,
        activePrompts,
        avgTokensPerPrompt,
        favoritesCount,
        newThisWeek,
        popularCategory,
      ] = await Promise.all([
        invoke<number>("get_prompts_count"),
        invoke<number>("get_categories_count"),
        invoke<number>("get_tags_count"),
        invoke<number>("get_active_prompts_count"),
        invoke<number>("get_avg_tokens_per_prompt"),
        invoke<number>("get_favorites_count"),
        invoke<number>("get_new_this_week_count"),
        invoke<string | null>("get_most_popular_category"),
      ]);
      setStats({
        totalPrompts,
        totalCategories,
        totalTags,
        activePrompts,
        avgTokensPerPrompt,
        favoritesCount,
        newThisWeek,
        popularCategory,
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, []);

  return { stats, loadStats };
}
