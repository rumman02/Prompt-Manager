use std::fs;
use std::path::Path;

// Import the real Database type from the library so we exercise the actual
// db.rs code path (not a reimplementation).
use prompt_manager_lib::Database;

fn fresh_db(path: &str) -> Database {
    let _ = fs::remove_file(path);
    let db = Database::new_for_path(Path::new(path)).unwrap();
    db.init_schema().unwrap();
    db
}

#[test]
fn test_empty_trash_basic() {
    let path = "/tmp/test_empty_trash_1.db";
    let db = fresh_db(path);

    // Insert 3 active + 3 trashed prompts
    for i in 0..3 {
        db.create_prompt(&format!("active-{}", i), "active", None, None, None).unwrap();
    }
    // Create then soft-delete
    for i in 0..3 {
        let p = db.create_prompt(&format!("trashed-{}", i), "trashed", None, None, None).unwrap();
        db.delete_prompt(p.id).unwrap();
    }

    let trashed = db.get_trashed_prompts().unwrap();
    assert_eq!(trashed.len(), 3, "should have 3 trashed prompts");

    let deleted = db.empty_trash().unwrap();
    assert_eq!(deleted, 3, "empty_trash should report 3 deleted");

    let trashed_after = db.get_trashed_prompts().unwrap();
    assert_eq!(trashed_after.len(), 0, "trash should be empty after empty_trash");

    let active = db.get_all_prompts().unwrap();
    assert_eq!(active.len(), 3, "active prompts should remain");

    let _ = fs::remove_file(path);
}

#[test]
fn test_empty_trash_is_noop_on_empty_trash() {
    let path = "/tmp/test_empty_trash_2.db";
    let db = fresh_db(path);

    let deleted = db.empty_trash().unwrap();
    assert_eq!(deleted, 0);

    let _ = fs::remove_file(path);
}
