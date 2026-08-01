import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import type { VaultEntry, VaultStatus } from "@/types";

interface VaultContextValue {
  vaults: VaultEntry[];
  activeVault: VaultEntry | null;
  needsSetup: boolean;
  /** true during the initial vault_status() call */
  loading: boolean;
  error: string | null;
  /** Re-runs vault_status + list_vaults */
  refresh: () => Promise<void>;
  /** Opens the folder dialog, derives the name from the folder basename, then invokes create_vault */
  createVault: () => Promise<void>;
  /** Opens the folder dialog, then invokes open_vault */
  openVault: () => Promise<void>;
  switchVault: (id: string) => Promise<void>;
  renameVault: (id: string, name: string) => Promise<void>;
  removeVault: (id: string) => Promise<void>;
  revealVault: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

/** Basename of a folder path, handling both / and \ separators. */
function basename(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<VaultEntry[]>([]);
  const [activeVault, setActiveVault] = useState<VaultEntry | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [status, list] = await Promise.all([
        invoke<VaultStatus>("vault_status"),
        invoke<VaultEntry[]>("list_vaults"),
      ]);
      setActiveVault(status.active);
      setNeedsSetup(status.needs_setup);
      setVaults(list);
      setError(null);
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const createVault = useCallback(async () => {
    const dir = await open({ directory: true, multiple: false, title: "Choose vault folder" });
    if (!dir) return; // user cancelled
    try {
      const name = basename(dir);
      await invoke<VaultEntry>("create_vault", { path: dir, name });
      window.location.reload();
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, []);

  const openVault = useCallback(async () => {
    const dir = await open({ directory: true, multiple: false, title: "Choose vault folder" });
    if (!dir) return; // user cancelled
    try {
      await invoke<VaultEntry>("open_vault", { path: dir });
      window.location.reload();
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, []);

  const switchVault = useCallback(async (id: string) => {
    try {
      await invoke<VaultEntry>("switch_vault", { id });
      window.location.reload();
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, []);

  const renameVault = useCallback(async (id: string, name: string) => {
    try {
      await invoke<VaultEntry>("rename_vault", { id, name });
      await refresh();
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, [refresh]);

  const removeVault = useCallback(async (id: string) => {
    try {
      await invoke<void>("remove_vault", { id });
      await refresh();
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, [refresh]);

  const revealVault = useCallback(async (id: string) => {
    try {
      await invoke<void>("reveal_vault", { id });
    } catch (e) {
      setError(String(e));
      toast.error(String(e));
    }
  }, []);

  return (
    <VaultContext.Provider
      value={{
        vaults,
        activeVault,
        needsSetup,
        loading,
        error,
        refresh,
        createVault,
        openVault,
        switchVault,
        renameVault,
        removeVault,
        revealVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
