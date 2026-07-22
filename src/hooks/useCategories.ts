import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CategoryCount } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryCount[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await invoke<CategoryCount[]>("get_category_counts");
      setCategories(result);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  const addCategory = useCallback(async (category: string) => {
    await invoke("add_category", { category });
  }, []);

  const deleteCategory = useCallback(async (category: string) => {
    await invoke("delete_category", { category });
  }, []);

  return { categories, loadCategories, addCategory, deleteCategory };
}
