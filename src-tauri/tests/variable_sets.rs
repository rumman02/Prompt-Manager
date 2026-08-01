use std::fs;
use std::path::Path;

// Exercise the real db.rs code path (not a reimplementation).
use prompt_manager_lib::Database;

fn fresh_db(path: &str) -> Database {
    let _ = fs::remove_file(path);
    let db = Database::new_for_path(Path::new(path)).unwrap();
    db.init_schema().unwrap();
    db
}

#[test]
fn test_variable_set_crud_and_active_semantics() {
    let path = "/tmp/test_variable_sets_1.db";
    let db = fresh_db(path);

    let prompt = db
        .create_prompt("Test", "Hello {{name}}", None, None, None, None)
        .unwrap();

    // No sets yet → no values, empty list.
    assert_eq!(db.list_variable_sets(prompt.id).unwrap().len(), 0);
    assert!(db.get_prompt_variables(prompt.id).unwrap().is_empty());

    // First set created for a prompt becomes active automatically.
    let set_a = db.create_variable_set(prompt.id, "Set A").unwrap();
    let sets = db.list_variable_sets(prompt.id).unwrap();
    assert_eq!(sets.len(), 1);
    assert_eq!(sets[0], (set_a, "Set A".to_string(), true));

    // Second set is created inactive; exactly one set is active at a time.
    let set_b = db.create_variable_set(prompt.id, "Set B").unwrap();
    let sets = db.list_variable_sets(prompt.id).unwrap();
    assert_eq!(sets.len(), 2);
    assert_eq!(sets.iter().filter(|(_, _, a)| *a).count(), 1);
    assert!(sets.iter().any(|(id, _, a)| *id == set_a && *a));

    // Values are scoped per set: same variable name, different values.
    db.upsert_prompt_variable(prompt.id, set_a, "name", "Alice").unwrap();
    db.upsert_prompt_variable(prompt.id, set_b, "name", "Bob").unwrap();

    // The active set (A) drives get_prompt_variables.
    assert_eq!(
        db.get_prompt_variables(prompt.id).unwrap(),
        vec![("name".to_string(), "Alice".to_string())]
    );

    // Switching the active set reloads the other set's values.
    db.set_active_variable_set(prompt.id, set_b).unwrap();
    assert_eq!(
        db.get_prompt_variables(prompt.id).unwrap(),
        vec![("name".to_string(), "Bob".to_string())]
    );

    // Upserting the same (set, name) updates in place, no duplicates.
    db.upsert_prompt_variable(prompt.id, set_a, "name", "Alicia").unwrap();
    db.set_active_variable_set(prompt.id, set_a).unwrap();
    let values = db.get_prompt_variables(prompt.id).unwrap();
    assert_eq!(values, vec![("name".to_string(), "Alicia".to_string())]);

    // Deleting the active set promotes the most recently created remaining set.
    db.set_active_variable_set(prompt.id, set_b).unwrap();
    db.delete_variable_set(set_b).unwrap();
    let sets = db.list_variable_sets(prompt.id).unwrap();
    assert_eq!(sets.len(), 1);
    assert_eq!(sets[0].0, set_a);
    assert!(sets[0].2, "remaining set should become active");
    assert_eq!(
        db.get_prompt_variables(prompt.id).unwrap(),
        vec![("name".to_string(), "Alicia".to_string())]
    );

    // Deleting the last set removes its values too.
    db.delete_variable_set(set_a).unwrap();
    assert!(db.list_variable_sets(prompt.id).unwrap().is_empty());
    assert!(db.get_prompt_variables(prompt.id).unwrap().is_empty());

    let _ = fs::remove_file(path);
}

#[test]
fn test_variable_set_backfill_migrates_legacy_values() {
    let path = "/tmp/test_variable_sets_2.db";
    let _ = fs::remove_file(path);

    // Build a pre-feature database by hand: prompt_variables without set_id and
    // the old (prompt_id, name) unique index, plus an existing saved value.
    {
        let conn = rusqlite::Connection::open(path).unwrap();
        conn.execute_batch(
            "CREATE TABLE prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT,
                tags TEXT,
                description TEXT,
                is_favorite INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME DEFAULT NULL
            );
            CREATE TABLE prompt_variables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                value TEXT DEFAULT '',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE UNIQUE INDEX idx_prompt_variables_name ON prompt_variables(prompt_id, name);
            INSERT INTO prompts (title, content) VALUES ('Legacy', 'Hi {{name}}');
            INSERT INTO prompt_variables (prompt_id, name, value) VALUES (1, 'name', 'Old value');",
        )
        .unwrap();
    }

    let db = Database::new_for_path(Path::new(path)).unwrap();
    db.init_schema().unwrap();

    // Backfill created an active Default set and moved the legacy value into it.
    let sets = db.list_variable_sets(1).unwrap();
    assert_eq!(sets.len(), 1);
    assert_eq!(sets[0].1, "Default");
    assert!(sets[0].2);
    let values = db.get_prompt_variables(1).unwrap();
    assert_eq!(values, vec![("name".to_string(), "Old value".to_string())]);

    let _ = fs::remove_file(path);
}

#[test]
fn test_variable_sets_cascade_on_prompt_delete() {
    let path = "/tmp/test_variable_sets_3.db";
    let db = fresh_db(path);

    let prompt = db.create_prompt("Doomed", "Hi {{name}}", None, None, None, None).unwrap();
    let set_a = db.create_variable_set(prompt.id, "A").unwrap();
    let set_b = db.create_variable_set(prompt.id, "B").unwrap();
    db.upsert_prompt_variable(prompt.id, set_a, "name", "Alice").unwrap();
    db.upsert_prompt_variable(prompt.id, set_b, "name", "Bob").unwrap();

    // Permanently deleting the prompt (as empty_trash does) removes its sets and
    // values — no orphaned rows.
    db.delete_prompt(prompt.id).unwrap(); // soft delete
    db.empty_trash().unwrap();

    assert!(db.list_variable_sets(prompt.id).unwrap().is_empty());
    assert!(db.get_prompt_variables(prompt.id).unwrap().is_empty());

    // And a recreated prompt with the same id would start clean (id reuse aside,
    // just assert the queries above return empty).
    let _ = fs::remove_file(path);
}
