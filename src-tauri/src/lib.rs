pub mod db;
pub mod demo;
pub mod vault;

// Version control commands


pub use db::Database;

fn init_db(app_handle: tauri::AppHandle) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.init().map_err(|e| e.to_string())?;
    db.seed_demo_prompts().map_err(|e| e.to_string())?;
    Ok(())
}

/// Initialize the database schema without seeding demo content.
/// Used by vault commands so a newly created/opened vault gets the
/// latest schema but no demo data unless the frontend asks for it.
fn init_db_schema(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let db = Database::new(app_handle).map_err(|e| e.to_string())?;
    db.init().map_err(|e| e.to_string())
}

#[tauri::command]
fn duplicate_prompt(app_handle: tauri::AppHandle, id: i64) -> Result<db::Prompt, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.duplicate_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_prompt(
    app_handle: tauri::AppHandle,
    title: String,
    content: String,
    category: Option<String>,
    tags: Option<String>,
    description: Option<String>,
    icon: Option<String>,
) -> Result<db::Prompt, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.create_prompt(
        &title,
        &content,
        category.as_deref(),
        tags.as_deref(),
        description.as_deref(),
        icon.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompts(app_handle: tauri::AppHandle) -> Result<Vec<db::Prompt>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_all_prompts().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompt(app_handle: tauri::AppHandle, id: i64) -> Result<db::Prompt, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_prompt(
    app_handle: tauri::AppHandle,
    id: i64,
    title: Option<String>,
    content: Option<String>,
    category: Option<String>,
    tags: Option<String>,
    description: Option<String>,
    icon: Option<String>,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.update_prompt(
        id,
        title.as_deref(),
        content.as_deref(),
        category.as_deref(),
        tags.as_deref(),
        description.as_deref(),
        icon.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_prompt(app_handle: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn search_prompts(app_handle: tauri::AppHandle, query: String) -> Result<Vec<db::Prompt>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.search_prompts(&query).map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_prompt(app_handle: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.restore_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn permanently_delete_prompt(app_handle: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.permanently_delete_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_trashed_prompts(app_handle: tauri::AppHandle) -> Result<Vec<db::Prompt>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_trashed_prompts().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_trash_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_trash_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn purge_expired_prompts(app_handle: tauri::AppHandle, days: i64) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.purge_expired_prompts(days).map_err(|e| e.to_string())
}

#[tauri::command]
fn empty_trash(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.empty_trash().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompts_by_category(
    app_handle: tauri::AppHandle,
    category: String,
) -> Result<Vec<db::Prompt>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_prompts_by_category(&category).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_categories(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_categories().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompts_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_prompts_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_categories_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_categories_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tags_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_tags_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_category_counts(app_handle: tauri::AppHandle) -> Result<Vec<db::CategoryCount>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_category_counts().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_favorite(app_handle: tauri::AppHandle, id: i64) -> Result<bool, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.toggle_favorite(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_active_prompts_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_active_prompts_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_avg_tokens_per_prompt(app_handle: tauri::AppHandle) -> Result<f64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_avg_tokens_per_prompt().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_favorites_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_favorites_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_new_this_week_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_new_this_week_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_most_popular_category(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_most_popular_category().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_agents_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_agents_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_skills_count(app_handle: tauri::AppHandle) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_skills_count().map_err(|e| e.to_string())
}

#[tauri::command]
fn seed_demo_prompts(app_handle: tauri::AppHandle) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.seed_demo_prompts().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_category(app_handle: tauri::AppHandle, category: String) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.add_category(&category).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_category(app_handle: tauri::AppHandle, category: String) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_category(&category).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_category(
    app_handle: tauri::AppHandle,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.rename_category(&old_name, &new_name).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_entity_icon(
    app_handle: tauri::AppHandle,
    entity_type: String,
    entity_name: String,
    icon: String,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.set_entity_icon(&entity_type, &entity_name, &icon)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_entity_icon(
    app_handle: tauri::AppHandle,
    entity_type: String,
    entity_name: String,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.clear_entity_icon(&entity_type, &entity_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_entity_icons(
    app_handle: tauri::AppHandle,
    entity_type: String,
) -> Result<Vec<db::EntityIcon>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_entity_icons(&entity_type).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_prompt_version(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
    title: String,
    content: String,
    category: Option<String>,
    tags: Option<String>,
    description: Option<String>,
    message: Option<String>,
) -> Result<db::PromptVersion, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.save_prompt_version(
        prompt_id,
        &title,
        &content,
        category.as_deref(),
        tags.as_deref(),
        description.as_deref(),
        message.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompt_versions(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
) -> Result<Vec<db::PromptVersion>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_prompt_versions(prompt_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_prompt_version(
    app_handle: tauri::AppHandle,
    id: i64,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_prompt_version(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_prompt_version(
    app_handle: tauri::AppHandle,
    id: i64,
    message: Option<String>,
) -> Result<db::PromptVersion, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.rename_prompt_version(id, message.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_prompt_variable(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
    set_id: i64,
    name: String,
    value: String,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.upsert_prompt_variable(prompt_id, set_id, &name, &value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_prompt_variables(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
) -> Result<Vec<(String, String)>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_prompt_variables(prompt_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_variable_set(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
    name: String,
) -> Result<i64, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.create_variable_set(prompt_id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_variable_sets(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
) -> Result<Vec<(i64, String, bool)>, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.list_variable_sets(prompt_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_active_variable_set(
    app_handle: tauri::AppHandle,
    prompt_id: i64,
    set_id: i64,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.set_active_variable_set(prompt_id, set_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_variable_set(
    app_handle: tauri::AppHandle,
    set_id: i64,
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_variable_set(set_id).map_err(|e| e.to_string())
}

// ── Vault commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn list_vaults(app_handle: tauri::AppHandle) -> Result<Vec<vault::VaultEntry>, String> {
    let reg = vault::read_registry(&app_handle)?;
    Ok(reg.vaults)
}

#[tauri::command]
fn vault_status(app_handle: tauri::AppHandle) -> Result<vault::VaultInfo, String> {
    let reg = vault::read_registry(&app_handle)?;
    let active = reg
        .active_vault_id
        .as_ref()
        .and_then(|id| reg.vaults.iter().find(|e| e.id == *id).cloned());
    let needs_setup = match &active {
        None => true,
        Some(entry) => !vault::is_vault_folder(std::path::Path::new(&entry.path)),
    };
    Ok(vault::VaultInfo { active, needs_setup })
}

#[tauri::command]
fn create_vault(
    app_handle: tauri::AppHandle,
    path: String,
    name: String,
) -> Result<vault::VaultEntry, String> {
    let folder = std::path::PathBuf::from(&path);
    std::fs::create_dir_all(&folder)
        .map_err(|e| format!("failed to create vault folder: {e}"))?;
    let canon = std::fs::canonicalize(&folder)
        .map_err(|e| format!("failed to resolve vault path: {e}"))?;

    let now = chrono::Utc::now().to_rfc3339();

    // Already a vault folder? Behave like open_vault instead of erroring.
    if vault::is_vault_folder(&canon) {
        return open_vault_inner(&app_handle, canon, now);
    }

    // Non-empty folder that is not a vault: refuse.
    let mut dir_entries = std::fs::read_dir(&canon)
        .map_err(|e| format!("failed to read folder: {e}"))?;
    if dir_entries.next().is_some() {
        return Err("folder is not empty and is not a vault".to_string());
    }

    // Write the marker file and initialise the database inside the folder.
    write_vault_marker(&canon, &name, &now)?;
    let entry = register_and_activate(&app_handle, &canon, &name, &now)?;
    init_db_schema(&app_handle)?;
    Ok(entry)
}

#[tauri::command]
fn open_vault(app_handle: tauri::AppHandle, path: String) -> Result<vault::VaultEntry, String> {
    let folder = std::path::PathBuf::from(&path);
    if !vault::is_vault_folder(&folder) {
        return Err("not a vault folder".to_string());
    }
    let canon = std::fs::canonicalize(&folder)
        .map_err(|e| format!("failed to resolve vault path: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let entry = open_vault_inner(&app_handle, canon, now)?;
    init_db_schema(&app_handle)?;
    Ok(entry)
}

#[tauri::command]
fn switch_vault(app_handle: tauri::AppHandle, id: String) -> Result<vault::VaultEntry, String> {
    let mut reg = vault::read_registry(&app_handle)?;
    let pos = reg
        .vaults
        .iter()
        .position(|e| e.id == id)
        .ok_or_else(|| "vault not found".to_string())?;
    if !vault::is_vault_folder(std::path::Path::new(&reg.vaults[pos].path)) {
        return Err("vault folder is missing".to_string());
    }
    reg.vaults[pos].last_opened_at = Some(chrono::Utc::now().to_rfc3339());
    reg.active_vault_id = Some(id);
    vault::write_registry(&app_handle, &reg)?;
    init_db_schema(&app_handle)?;
    Ok(reg.vaults[pos].clone())
}

#[tauri::command]
fn rename_vault(
    app_handle: tauri::AppHandle,
    id: String,
    name: String,
) -> Result<vault::VaultEntry, String> {
    let mut reg = vault::read_registry(&app_handle)?;
    let pos = reg
        .vaults
        .iter()
        .position(|e| e.id == id)
        .ok_or_else(|| "vault not found".to_string())?;
    reg.vaults[pos].name = name.clone();
    update_marker_name(&reg.vaults[pos].path, &name)?;
    vault::write_registry(&app_handle, &reg)?;
    Ok(reg.vaults[pos].clone())
}

#[tauri::command]
fn remove_vault(app_handle: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut reg = vault::read_registry(&app_handle)?;
    let pos = reg
        .vaults
        .iter()
        .position(|e| e.id == id)
        .ok_or_else(|| "vault not found".to_string())?;
    reg.vaults.remove(pos);
    if reg.active_vault_id.as_deref() == Some(id.as_str()) {
        reg.active_vault_id = None;
    }
    vault::write_registry(&app_handle, &reg)
}

#[tauri::command]
fn reveal_vault(app_handle: tauri::AppHandle, id: String) -> Result<(), String> {
    let reg = vault::read_registry(&app_handle)?;
    let entry = reg
        .vaults
        .iter()
        .find(|e| e.id == id)
        .ok_or_else(|| "vault not found".to_string())?;
    let path = std::path::PathBuf::from(&entry.path);
    #[cfg(target_os = "macos")]
    let status = std::process::Command::new("open").arg(&path).status();
    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("explorer").arg(&path).status();
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let status = std::process::Command::new("xdg-open").arg(&path).status();
    status
        .map_err(|e| format!("failed to open vault folder: {e}"))?
        .success()
        .then_some(())
        .ok_or_else(|| "failed to open vault folder".to_string())
}

/// Shared open path: register (or reuse) the entry, activate it, persist.
/// Does NOT touch the database — callers run init separately.
fn open_vault_inner(
    app_handle: &tauri::AppHandle,
    canon: std::path::PathBuf,
    now: String,
) -> Result<vault::VaultEntry, String> {
    let mut reg = vault::read_registry(app_handle)?;
    let canon_str = canon.to_string_lossy().to_string();
    let entry = if let Some(pos) = reg.vaults.iter().position(|e| e.path == canon_str) {
        reg.vaults[pos].last_opened_at = Some(now);
        reg.vaults[pos].clone()
    } else {
        let entry = vault::VaultEntry {
            id: uuid::Uuid::new_v4().to_string(),
            name: canon
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| canon_str.clone()),
            path: canon_str.clone(),
            created_at: now.clone(),
            last_opened_at: Some(now),
            exists: true,
        };
        reg.vaults.push(entry.clone());
        entry
    };
    reg.active_vault_id = Some(entry.id.clone());
    vault::write_registry(app_handle, &reg)?;
    Ok(entry)
}

/// Register (or reuse) a freshly created vault and make it active.
fn register_and_activate(
    app_handle: &tauri::AppHandle,
    canon: &std::path::Path,
    name: &str,
    now: &str,
) -> Result<vault::VaultEntry, String> {
    let mut reg = vault::read_registry(app_handle)?;
    let canon_str = canon.to_string_lossy().to_string();
    let entry = if let Some(pos) = reg.vaults.iter().position(|e| e.path == canon_str) {
        reg.vaults[pos].name = name.to_string();
        reg.vaults[pos].last_opened_at = Some(now.to_string());
        reg.vaults[pos].clone()
    } else {
        let entry = vault::VaultEntry {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            path: canon_str.clone(),
            created_at: now.to_string(),
            last_opened_at: Some(now.to_string()),
            exists: true,
        };
        reg.vaults.push(entry.clone());
        entry
    };
    reg.active_vault_id = Some(entry.id.clone());
    vault::write_registry(app_handle, &reg)?;
    Ok(entry)
}

fn write_vault_marker(path: &std::path::Path, name: &str, now: &str) -> Result<(), String> {
    let marker = serde_json::json!({
        "name": name,
        "created_at": now,
        "schema_version": 1,
    });
    let raw = serde_json::to_string_pretty(&marker)
        .map_err(|e| format!("failed to serialize marker: {e}"))?;
    let dir = path.join(".promptmanager");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("failed to create .promptmanager dir: {e}"))?;
    std::fs::write(dir.join("vault.json"), raw)
        .map_err(|e| format!("failed to write vault marker: {e}"))?;
    Ok(())
}

fn update_marker_name(path: &str, name: &str) -> Result<(), String> {
    let marker_path = std::path::Path::new(path).join(".promptmanager/vault.json");
    if !marker_path.is_file() {
        return Ok(());
    }
    let raw = std::fs::read_to_string(&marker_path)
        .map_err(|e| format!("failed to read vault marker: {e}"))?;
    let mut marker: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(m) => m,
        Err(_) => return Ok(()), // not writable/parseable: skip silently
    };
    marker["name"] = serde_json::Value::String(name.to_string());
    let out = serde_json::to_string_pretty(&marker)
        .map_err(|e| format!("failed to serialize marker: {e}"))?;
    std::fs::write(&marker_path, out)
        .map_err(|e| format!("failed to update vault marker: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            if vault::active_vault_path(&handle).is_some() {
                tauri::async_runtime::block_on(async move {
                    if let Err(e) = init_db(handle) {
                        eprintln!("db init failed: {e}");
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_prompt,
            get_prompts,
            get_prompt,
            update_prompt,
            delete_prompt,
            search_prompts,
            restore_prompt,
            permanently_delete_prompt,
            get_trashed_prompts,
            get_trash_count,
            purge_expired_prompts,
            empty_trash,
            get_prompts_by_category,
            get_categories,
            get_prompts_count,
            get_categories_count,
            get_tags_count,
            get_category_counts,
            duplicate_prompt,
            toggle_favorite,
            get_active_prompts_count,
            get_avg_tokens_per_prompt,
            get_favorites_count,
            get_new_this_week_count,
            get_most_popular_category,
            get_agents_count,
            get_skills_count,
            seed_demo_prompts,
            add_category,
            delete_category,
            rename_category,
            set_entity_icon,
            clear_entity_icon,
            get_entity_icons,
            save_prompt_version,
            get_prompt_versions,
            delete_prompt_version,
            rename_prompt_version,
            save_prompt_variable,
            get_prompt_variables,
            create_variable_set,
            list_variable_sets,
            set_active_variable_set,
            delete_variable_set,
            list_vaults,
            vault_status,
            create_vault,
            open_vault,
            switch_vault,
            rename_vault,
            remove_vault,
            reveal_vault,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
