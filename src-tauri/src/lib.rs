mod db;

use db::Database;
use tauri::Manager;

fn init_db(app_handle: tauri::AppHandle) -> Result<(), String> {
    let db = Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.init().map_err(|e| e.to_string())?;
    Ok(())
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
            get_prompts_by_category,
            get_categories,
            get_prompts_count,
            get_categories_count,
            get_tags_count,
            get_category_counts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
