use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

const REGISTRY_FILE: &str = "vaults.json";
const MARKER_REL: &str = ".promptmanager/vault.json";
const DB_EXT: &str = "db";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultEntry {
    pub id: String,            // uuid v4
    pub name: String,
    pub path: String,          // absolute path to the vault FOLDER
    pub created_at: String,    // RFC3339
    pub last_opened_at: Option<String>,
    pub exists: bool,          // computed at read time: does path/.promptmanager/vault.json exist
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultRegistry {
    pub vaults: Vec<VaultEntry>,
    pub active_vault_id: Option<String>,
}

impl Default for VaultRegistry {
    fn default() -> Self {
        Self {
            vaults: Vec::new(),
            active_vault_id: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultInfo {
    pub active: Option<VaultEntry>,
    pub needs_setup: bool, // true when there is no active vault OR its folder is missing
}

fn registry_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .map(|d| d.join(REGISTRY_FILE))
        .unwrap_or_else(|_| PathBuf::from(REGISTRY_FILE))
}

pub fn read_registry(app: &tauri::AppHandle) -> Result<VaultRegistry, String> {
    let path = registry_path(app);
    if !path.exists() {
        return Ok(VaultRegistry::default());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("failed to read vault registry: {e}"))?;
    let mut reg: VaultRegistry = match serde_json::from_str(&raw) {
        Ok(r) => r,
        Err(_) => return Ok(VaultRegistry::default()), // corrupt json: do not hard-fail
    };
    for entry in reg.vaults.iter_mut() {
        entry.exists = is_vault(Path::new(&entry.path));
    }
    Ok(reg)
}

pub fn write_registry(app: &tauri::AppHandle, reg: &VaultRegistry) -> Result<(), String> {
    let path = registry_path(app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("failed to create config dir: {e}"))?;
    }
    let raw = serde_json::to_string_pretty(reg).map_err(|e| format!("failed to serialize registry: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("failed to write vault registry: {e}"))?;
    Ok(())
}

/// True when `path/.promptmanager/vault.json` exists and is a file.
pub fn is_vault_folder(path: &Path) -> bool {
    path.join(MARKER_REL).is_file()
}

/// True when `path` is an existing file whose extension is `db` (case-insensitive).
pub fn is_vault_file(path: &Path) -> bool {
    path.extension()
        .map(|ext| ext.eq_ignore_ascii_case(DB_EXT))
        .unwrap_or(false)
        && path.is_file()
}

/// True when `path` ends in `.db` (case-insensitive), regardless of whether the file exists yet.
pub fn has_db_extension(path: &Path) -> bool {
    path.extension()
        .map(|ext| ext.eq_ignore_ascii_case(DB_EXT))
        .unwrap_or(false)
}

/// True when `path` is a vault: an existing `.db` file or a folder with the legacy marker.
pub fn is_vault(path: &Path) -> bool {
    is_vault_file(path) || is_vault_folder(path)
}

/// Resolve the SQLite DB path for a vault: the path itself when it ends in `.db`,
/// otherwise `<path>/prompts.db` for legacy folder vaults.
pub fn vault_db_path(path: &Path) -> PathBuf {
    if has_db_extension(path) {
        path.to_path_buf()
    } else {
        path.join("prompts.db")
    }
}

pub fn active_vault_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    let reg = read_registry(app).ok()?;
    let id = reg.active_vault_id?;
    reg.vaults
        .into_iter()
        .find(|e| e.id == id && is_vault(Path::new(&e.path)))
        .map(|e| PathBuf::from(e.path))
}

pub fn active_db_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    active_vault_path(app).map(|p| vault_db_path(&p))
}
