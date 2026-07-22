import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PromptRow } from "@/types";

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<PromptRow[]>("get_prompts");
      setPrompts(result);
    } catch (e) {
      console.error("Failed to load prompts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPrompt = useCallback(async (data: {
    title: string;
    content: string;
    category: string;
    tags: string;
    description: string;
  }) => {
    await invoke("create_prompt", {
      title: data.title,
      content: data.content,
      category: data.category || null,
      tags: data.tags || null,
      description: data.description || null,
    });
  }, []);

  const updatePrompt = useCallback(async (id: number, data: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
    description?: string;
  }) => {
    await invoke("update_prompt", {
      id,
      title: data.title ?? null,
      content: data.content ?? null,
      category: data.category ?? null,
      tags: data.tags ?? null,
      description: data.description ?? null,
    });
  }, []);

  const deletePrompt = useCallback(async (id: number) => {
    await invoke("delete_prompt", { id });
  }, []);

  const searchPrompts = useCallback(async (query: string) => {
    const result = await invoke<PromptRow[]>("search_prompts", { query });
    setPrompts(result);
  }, []);

  const getPromptsByCategory = useCallback(async (category: string) => {
    const result = await invoke<PromptRow[]>("get_prompts_by_category", { category });
    setPrompts(result);
  }, []);

  const toggleFavorite = useCallback(async (id: number) => {
    await invoke("toggle_favorite", { id });
  }, []);

  return {
    prompts,
    loading,
    loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    getPromptsByCategory,
    toggleFavorite,
  };
}
