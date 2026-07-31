import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PromptRow, VariableSet } from "@/types";

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

  const duplicatePrompt = useCallback(async (id: number) => {
    await invoke("duplicate_prompt", { id });
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

  // Variable values are stored as {name: value} pairs scoped to a prompt's
  // ACTIVE variable set (the backend filters by it). getPromptVariables returns
  // them as (name, value) tuples from the backend; we flatten into a record for
  // easy lookups in the UI.
  const getPromptVariables = useCallback(async (id: number) => {
    const rows = await invoke<[string, string][]>("get_prompt_variables", {
      promptId: id,
    });
    const record: Record<string, string> = {};
    for (const [name, value] of rows) {
      record[name] = value;
    }
    return record;
  }, []);

  const savePromptVariable = useCallback(
    async (promptId: number, setId: number, name: string, value: string) => {
      await invoke("save_prompt_variable", { promptId, setId, name, value });
    },
    []
  );

  // ── Variable sets ─────────────────────────────────────────────────────────
  // One prompt can hold many named sets of variable values; the UI switches the
  // active set to read/write a different set of values for the same prompt.

  const createVariableSet = useCallback(async (promptId: number, name: string) => {
    return await invoke<number>("create_variable_set", { promptId, name });
  }, []);

  const listVariableSets = useCallback(async (promptId: number) => {
    const rows = await invoke<[number, string, boolean][]>("list_variable_sets", {
      promptId,
    });
    return rows.map(([id, name, isActive]) => ({ id, name, isActive }));
  }, []);

  const setActiveVariableSet = useCallback(async (promptId: number, setId: number) => {
    await invoke("set_active_variable_set", { promptId, setId });
  }, []);

  const deleteVariableSet = useCallback(async (setId: number) => {
    await invoke("delete_variable_set", { setId });
  }, []);

  return {
    prompts,
    loading,
    loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    searchPrompts,
    getPromptsByCategory,
    toggleFavorite,
    getPromptVariables,
    savePromptVariable,
    createVariableSet,
    listVariableSets,
    setActiveVariableSet,
    deleteVariableSet,
  };
}
