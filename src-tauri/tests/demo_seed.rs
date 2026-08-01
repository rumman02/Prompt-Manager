use std::collections::HashSet;
use std::fs;
use std::path::Path;

// Exercise the real db.rs seed code path (not a reimplementation).
use prompt_manager_lib::Database;

fn fresh_db(path: &str) -> Database {
    let _ = fs::remove_file(path);
    let db = Database::new_for_path(Path::new(path)).unwrap();
    db.init_schema().unwrap();
    db
}

#[test]
fn test_seed_populates_full_demo_library() {
    let path = "/tmp/test_demo_seed_1.db";
    let db = fresh_db(path);
    db.seed_demo_prompts().unwrap();

    let active = db.get_all_prompts().unwrap();
    let trashed = db.get_trashed_prompts().unwrap();

    // 47 seeded prompts split into 43 active + 4 trashed. If the real split
    // differs, the message prints both numbers; the relationship is what counts.
    assert_eq!(
        active.len() + trashed.len(),
        47,
        "active({}) + trashed({}) should equal 47 seeded prompts",
        active.len(),
        trashed.len()
    );
    assert_eq!(
        active.len(),
        43,
        "expected 43 active prompts (47 seeded - 4 trashed), got {}",
        active.len()
    );
    assert_eq!(trashed.len(), 4, "expected 4 trashed prompts, got {}", trashed.len());
    assert_eq!(db.get_trash_count().unwrap(), 4);
    assert_eq!(db.get_favorites_count().unwrap(), 12);
    assert_eq!(db.get_categories().unwrap().len(), 12);

    // Every seeded prompt (including trashed) must be fully populated.
    for p in active.iter().chain(trashed.iter()) {
        assert!(!p.title.trim().is_empty(), "prompt {} has empty title", p.id);
        assert!(!p.content.trim().is_empty(), "prompt {} has empty content", p.id);
        let category = p.category.as_deref().unwrap_or("").trim();
        assert!(!category.is_empty(), "prompt {} has empty category", p.id);
        let tags = p.tags.as_deref().unwrap_or("").trim();
        assert!(!tags.is_empty(), "prompt {} has empty tags", p.id);
        let description = p.description.as_deref().unwrap_or("").trim();
        assert!(!description.is_empty(), "prompt {} has empty description", p.id);
    }

    // No duplicate titles across all 47 prompts, trashed included.
    let titles: HashSet<&str> = active
        .iter()
        .chain(trashed.iter())
        .map(|p| p.title.as_str())
        .collect();
    assert_eq!(
        titles.len(),
        active.len() + trashed.len(),
        "all demo prompt titles must be distinct"
    );

    let _ = fs::remove_file(path);
}

#[test]
fn test_seed_creates_variable_sets_and_versions() {
    let path = "/tmp/test_demo_seed_2.db";
    let db = fresh_db(path);
    db.seed_demo_prompts().unwrap();

    let active = db.get_all_prompts().unwrap();
    let mut with_sets = 0;
    let mut with_multiple_sets = 0;
    let mut with_versions = 0;

    for p in &active {
        let sets = db.list_variable_sets(p.id).unwrap();
        if !sets.is_empty() {
            with_sets += 1;
            if sets.len() > 1 {
                with_multiple_sets += 1;
            }
            // The active set drives get_prompt_variables; every seeded value is
            // non-empty, so no blank placeholders should leak through.
            for (_name, value) in db.get_prompt_variables(p.id).unwrap() {
                assert!(
                    !value.is_empty(),
                    "prompt {} has an empty variable value",
                    p.id
                );
            }
        }
        if !db.get_prompt_versions(p.id).unwrap().is_empty() {
            with_versions += 1;
        }
    }

    assert!(
        with_sets >= 20,
        "expected >= 20 prompts with variable sets, got {}",
        with_sets
    );
    assert!(
        with_multiple_sets >= 4,
        "expected >= 4 prompts with multiple variable sets, got {}",
        with_multiple_sets
    );
    assert!(
        with_versions >= 12,
        "expected >= 12 prompts with version history, got {}",
        with_versions
    );

    let _ = fs::remove_file(path);
}

#[test]
fn test_seed_is_idempotent() {
    let path = "/tmp/test_demo_seed_3.db";
    let db = fresh_db(path);

    db.seed_demo_prompts().unwrap();
    let after_first = db.get_all_prompts().unwrap().len() + db.get_trashed_prompts().unwrap().len();

    db.seed_demo_prompts().unwrap();
    let after_second = db.get_all_prompts().unwrap().len() + db.get_trashed_prompts().unwrap().len();

    assert_eq!(
        after_first, after_second,
        "re-seeding must not duplicate prompts ({} vs {})",
        after_first, after_second
    );

    let _ = fs::remove_file(path);
}

#[test]
fn test_seed_replaces_legacy_demo_rows() {
    let path = "/tmp/test_demo_seed_4.db";
    let db = fresh_db(path);

    // Pre-existing user content must be wiped by the version-bumped reseed.
    db.create_prompt("Legacy Prompt", "old content", None, None, None, None).unwrap();
    db.seed_demo_prompts().unwrap();

    let active = db.get_all_prompts().unwrap();
    let trashed = db.get_trashed_prompts().unwrap();
    assert!(
        !active.iter().any(|p| p.title == "Legacy Prompt"),
        "legacy prompt survived in active prompts"
    );
    assert!(
        !trashed.iter().any(|p| p.title == "Legacy Prompt"),
        "legacy prompt survived in trashed prompts"
    );
    assert_eq!(
        active.len() + trashed.len(),
        47,
        "expected exactly 47 demo prompts after reseed, got {}",
        active.len() + trashed.len()
    );

    let _ = fs::remove_file(path);
}
