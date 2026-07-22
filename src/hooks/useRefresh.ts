import { useCallback } from "react";
import { usePrompts } from "./usePrompts";
import { useStats } from "./useStats";
import { useCategories } from "./useCategories";

export function useRefresh() {
  const { loadPrompts } = usePrompts();
  const { loadStats } = useStats();
  const { loadCategories } = useCategories();

  const refresh = useCallback(async () => {
    await Promise.all([loadPrompts(), loadStats(), loadCategories()]);
  }, [loadPrompts, loadStats, loadCategories]);

  return refresh;
}
