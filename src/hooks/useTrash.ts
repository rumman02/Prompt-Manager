import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PromptRow } from "@/types";

export function useTrash() {
  const [trashedPrompts, setTrashedPrompts] = useState<PromptRow[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTrashedPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<PromptRow[]>("get_trashed_prompts");
      setTrashedPrompts(result);
    } catch (e) {
      console.error("Failed to load trashed prompts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrashCount = useCallback(async () => {
    try {
      const count = await invoke<number>("get_trash_count");
      setTrashCount(count);
    } catch {
      // Ignore errors
    }
  }, []);

  const restorePrompt = useCallback(async (id: number) => {
    await invoke("restore_prompt", { id });
  }, []);

  const permanentlyDeletePrompt = useCallback(async (id: number) => {
    await invoke("permanently_delete_prompt", { id });
  }, []);

  const emptyTrash = useCallback(async () => {
    await invoke("empty_trash");
  }, []);

  return {
    trashedPrompts,
    trashCount,
    loading,
    loadTrashedPrompts,
    loadTrashCount,
    restorePrompt,
    permanentlyDeletePrompt,
    emptyTrash,
  };
}
