import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Stats {
  totalAgents: number;
  totalSkills: number;
  totalPrompts: number;
  totalCategories: number;
  favoritesCount: number;
  tagsCount: number;
  trashCount: number;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    totalSkills: 0,
    totalPrompts: 0,
    totalCategories: 0,
    favoritesCount: 0,
    tagsCount: 0,
    trashCount: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const [
        totalAgents,
        totalSkills,
        totalPrompts,
        totalCategories,
        favoritesCount,
        tagsCount,
        trashCount,
      ] = await Promise.all([
        invoke<number>("get_agents_count"),
        invoke<number>("get_skills_count"),
        invoke<number>("get_prompts_count"),
        invoke<number>("get_categories_count"),
        invoke<number>("get_favorites_count"),
        invoke<number>("get_tags_count"),
        invoke<number>("get_trash_count"),
      ]);
      setStats({
        totalAgents,
        totalSkills,
        totalPrompts,
        totalCategories,
        favoritesCount,
        tagsCount,
        trashCount,
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, []);

  return { stats, loadStats };
}
