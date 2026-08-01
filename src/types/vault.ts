export interface VaultEntry {
  id: string;
  name: string;
  /** Absolute path to the vault folder */
  path: string;
  /** RFC3339 */
  created_at: string;
  last_opened_at: string | null;
  /** false when the folder was moved/deleted */
  exists: boolean;
}

export interface VaultStatus {
  active: VaultEntry | null;
  needs_setup: boolean;
}
