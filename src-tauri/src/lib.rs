pub mod db;

// Version control commands


pub use db::Database;
use tauri::Manager;

fn init_db(app_handle: tauri::AppHandle) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.init().map_err(|e| e.to_string())?;
    db.seed_demo_prompts().map_err(|e| e.to_string())?;
    Ok(())
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
) -> Result<db::Prompt, String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.create_prompt(&title, &content, category.as_deref(), tags.as_deref(), description.as_deref())
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
) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.update_prompt(
        id,
        title.as_deref(),
        content.as_deref(),
        category.as_deref(),
        tags.as_deref(),
        description.as_deref(),
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                init_db(handle).expect("Failed to initialize database");
            });
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
            save_prompt_version,
            get_prompt_versions,
            delete_prompt_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
