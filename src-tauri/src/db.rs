use crate::demo;
use rusqlite::{Connection, OptionalExtension, Result, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prompt {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub is_favorite: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Page<T> {
    pub items: Vec<T>,
    pub total: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchHit {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub snippet: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagCount {
    pub tag: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EntityIcon {
    pub name: String,
    pub icon: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PromptVersion {
    pub id: i64,
    pub prompt_id: i64,
    pub version_number: i64,
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub message: Option<String>,
    pub created_at: String,
}

/// Build a short excerpt (~`width` chars) centred on the first case-insensitive
/// occurrence of `query` within `content`, or the head of `content` if there is
/// no match. Operates on Unicode character indices (not bytes), so slicing never
/// panics and `to_lowercase()` length shifts can't produce an invalid boundary.
fn excerpt(content: &str, query: &str, width: usize) -> String {
    let chars: Vec<char> = content.chars().collect();
    let needles: Vec<char> = query.to_lowercase().chars().collect();
    if needles.is_empty() {
        return chars.iter().take(width).collect();
    }
    let lowered: Vec<char> = content.to_lowercase().chars().collect();
    let mut start = 0usize;
    if needles.len() <= lowered.len() {
        'outer: for i in 0..=(lowered.len() - needles.len()) {
            for (a, b) in lowered[i..].iter().zip(needles.iter()) {
                if a != b {
                    continue 'outer;
                }
            }
            start = i;
            break;
        }
    }
    let half = width / 2;
    let s = start.saturating_sub(half);
    let e = (s + width).min(chars.len());
    let mut out: String = if s == 0 {
        chars[..e].iter().collect()
    } else {
        chars[s..e].iter().collect()
    };
    if s > 0 {
        out.insert(0, '…');
    }
    if e < chars.len() {
        out.push('…');
    }
    out
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self> {
        let path = crate::vault::active_db_path(app_handle)
            .ok_or_else(|| rusqlite::Error::InvalidPath("no active vault selected".into()))?;

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&path)?;
        Ok(Self { conn })
    }

    /// Create a Database backed by an explicit path. Prefer `new()` (which uses
    /// the app data dir); this exists so tests can point at a temp file without
    /// needing a live `AppHandle`.
    pub fn new_for_path(path: &std::path::Path) -> Result<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(path)?;
        Ok(Self { conn })
    }

    /// Run the production schema setup (`init()`). Exposed separately so tests
    /// can initialize a temp DB without an `AppHandle`.
    pub fn init_schema(&self) -> Result<()> {
        self.init()
    }

    pub fn init(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT,
                tags TEXT,
                description TEXT,
                icon TEXT DEFAULT NULL,
                is_favorite INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME DEFAULT NULL
            )",
            [],
        )?;

        // Add is_favorite column if it doesn't exist (migration)
        let _ = self.conn.execute(
            "ALTER TABLE prompts ADD COLUMN is_favorite INTEGER DEFAULT 0",
            [],
        );

        // Add icon column if it doesn't exist (migration). Stores a semantic
        // icon-registry key chosen by the user; NULL means "use the default".
        let _ = self.conn.execute(
            "ALTER TABLE prompts ADD COLUMN icon TEXT DEFAULT NULL",
            [],
        );

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts(title)",
            [],
        )?;

        // Remove the legacy FTS5 full-text index and its triggers.
        //
        // `prompts_fts` + prompts_ai/ad/au triggers were an FTS5 experiment that
        // is not used by any read path (search_prompts uses LIKE on `prompts`),
        // but every INSERT/UPDATE/DELETE on `prompts` still fired the triggers,
        // which write into an FTS5 virtual table. FTS5 forbids that ("unsafe use
        // of virtual table"), and rusqlite's bundled FTS5 surfaces it as
        // "disk I/O error" (SQLITE_IOERR) — the error that blocked prompt
        // creation. Dropping both table and triggers removes the failure while
        // keeping search (LIKE-based) intact.
        self.conn.execute("DROP TRIGGER IF EXISTS prompts_ai", [])?;
        self.conn.execute("DROP TRIGGER IF EXISTS prompts_ad", [])?;
        self.conn.execute("DROP TRIGGER IF EXISTS prompts_au", [])?;
        self.conn.execute("DROP TABLE IF EXISTS prompts_fts", [])?;

        // Add deleted_at column if it doesn't exist (migration)
        let _ = self.conn.execute(
            "ALTER TABLE prompts ADD COLUMN deleted_at DATETIME DEFAULT NULL",
            [],
        );

        // Rename `collection` -> `category` if the old name still exists.
        //
        // An earlier schema used `collection` for this column; the codebase now
        // calls it `category`. Without this migration, the INSERT in create_prompt
        // ("INSERT INTO prompts (title, content, category, ...)") fails with
        // "table prompts has no column named category" — the error that blocked
        // prompt creation. PRAGMA table_info is stable across SQLite versions,
        // unlike parsing `.schema` output.
        let has_collection: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM pragma_table_info('prompts') WHERE name = 'collection')",
            [],
            |row| row.get(0),
        )?;
        if has_collection {
            self.conn
                .execute("ALTER TABLE prompts RENAME COLUMN collection TO category", [])?;
        }

        // Create prompt_versions table for version control
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS prompt_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_id INTEGER NOT NULL,
                version_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT,
                tags TEXT,
                description TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id)",
            [],
        )?;

        // Create agents table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                prompt_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Create skills table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Create variable_sets table — named collections of variable values for a
        // prompt. One prompt has many sets; exactly one (is_active=1) is the set
        // the editor reads/writes by default. Must be created before
        // prompt_variables (its rows are FK targets for prompt_variables.set_id).
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS variable_sets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                is_active INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
            )",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_variable_sets_prompt_id ON variable_sets(prompt_id)",
            [],
        )?;

        // Create prompt_variables table — stores user-entered values for each
        // {{variable}} detected (or custom) in a prompt, scoped to (prompt, set)
        // so the same variable can hold a different value per variable set.
        // Unique (prompt_id, set_id, name) so a variable has exactly one value
        // per set; UPSERT semantics in upsert_prompt_variable.
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS prompt_variables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_id INTEGER NOT NULL,
                set_id INTEGER,
                name TEXT NOT NULL,
                value TEXT DEFAULT '',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
                FOREIGN KEY (set_id) REFERENCES variable_sets(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create entity_icons table — generic key-value store for custom icons
        // on named entities (categories and tags), which have no tables of their
        // own. Keys are (entity_type, entity_name); NULL/missing means "default".
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS entity_icons (
                entity_type TEXT NOT NULL,
                entity_name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT,
                PRIMARY KEY (entity_type, entity_name)
            )",
            [],
        )?;

        // Migration: databases created before entity colors have no color
        // column. Error-tolerant so it's a no-op when the column already
        // exists (fresh databases get it from the CREATE TABLE above).
        let _ = self.conn.execute(
            "ALTER TABLE entity_icons ADD COLUMN color TEXT",
            [],
        );

        // Migration: databases created before variable sets have no set_id
        // column. Add it, then upgrade the unique index from (prompt_id, name)
        // to (prompt_id, set_id, name) so two sets can each hold a value for the
        // same variable name.
        let has_set_id: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM pragma_table_info('prompt_variables') WHERE name = 'set_id')",
            [],
            |row| row.get(0),
        )?;
        if !has_set_id {
            self.conn
                .execute("ALTER TABLE prompt_variables ADD COLUMN set_id INTEGER", [])?;
        }
        self.conn.execute("DROP INDEX IF EXISTS idx_prompt_variables_name", [])?;
        self.conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_variables_name
             ON prompt_variables(prompt_id, set_id, name)",
            [],
        )?;

        // Backfill: prompts that already had saved variables before this feature
        // get a default set, and their values are migrated into it so nothing is
        // orphaned.
        let orphan_prompts: Vec<i64> = self
            .conn
            .prepare("SELECT DISTINCT prompt_id FROM prompt_variables WHERE set_id IS NULL")?
            .query_map([], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();
        for prompt_id in orphan_prompts {
            let set_id = self.get_or_create_default_set(prompt_id)?;
            self.conn.execute(
                "UPDATE prompt_variables SET set_id = ?1 WHERE prompt_id = ?2 AND set_id IS NULL",
                rusqlite::params![set_id, prompt_id],
            )?;
        }

        Ok(())
    }

    /// Insert or update the value of a single variable for a prompt's set.
    /// The UNIQUE index on (prompt_id, set_id, name) makes this idempotent —
    /// re-saving the same variable in the same set updates its value +
    /// timestamp rather than duplicating.
    pub fn upsert_prompt_variable(&self, prompt_id: i64, set_id: i64, name: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO prompt_variables (prompt_id, set_id, name, value)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(prompt_id, set_id, name)
             DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            rusqlite::params![prompt_id, set_id, name, value],
        )?;
        Ok(())
    }

    /// Fetch the active set's saved variable values for a prompt, returned as
    /// (name, value) pairs. Prompts with no active set return an empty list.
    pub fn get_prompt_variables(&self, prompt_id: i64) -> Result<Vec<(String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT pv.name, pv.value FROM prompt_variables pv
             JOIN variable_sets vs ON vs.id = pv.set_id
             WHERE pv.prompt_id = ?1 AND vs.is_active = 1",
        )?;
        let rows = stmt
            .query_map([prompt_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?
            .collect::<Vec<_>>();
        Ok(rows.into_iter().filter_map(|r| r.ok()).collect())
    }

    // ── Variable sets ─────────────────────────────────────────────────────────
    // One prompt can hold many named sets of variable values; exactly one set is
    // active at a time, and the editor reads/writes the active set's values.

    /// Create a named set for a prompt. The first set created for a prompt (or
    /// any set created while the prompt has no active set) becomes active.
    pub fn create_variable_set(&self, prompt_id: i64, name: &str) -> Result<i64> {
        let has_active: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM variable_sets WHERE prompt_id = ?1 AND is_active = 1",
            [prompt_id],
            |row| row.get(0),
        )?;
        self.conn.execute(
            "INSERT INTO variable_sets (prompt_id, name, is_active) VALUES (?1, ?2, ?3)",
            rusqlite::params![prompt_id, name, if has_active == 0 { 1 } else { 0 }],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// List a prompt's sets as (id, name, is_active) ordered by creation time.
    pub fn list_variable_sets(&self, prompt_id: i64) -> Result<Vec<(i64, String, bool)>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, is_active FROM variable_sets WHERE prompt_id = ?1 ORDER BY created_at, id",
        )?;
        let rows = stmt
            .query_map([prompt_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i64>(2)? != 0,
                ))
            })?
            .collect::<Vec<_>>();
        Ok(rows.into_iter().filter_map(|r| r.ok()).collect())
    }

    /// Mark `set_id` as the prompt's active set, clearing the flag on the rest.
    pub fn set_active_variable_set(&self, prompt_id: i64, set_id: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE variable_sets SET is_active = 0 WHERE prompt_id = ?1",
            [prompt_id],
        )?;
        self.conn.execute(
            "UPDATE variable_sets SET is_active = 1 WHERE id = ?1 AND prompt_id = ?2",
            rusqlite::params![set_id, prompt_id],
        )?;
        Ok(())
    }

    /// Delete a set and its saved values. If it was the active set, the most
    /// recently created remaining set becomes active (or none if it was the last).
    pub fn delete_variable_set(&self, set_id: i64) -> Result<()> {
        let prompt_id: Option<i64> = self
            .conn
            .query_row(
                "SELECT prompt_id FROM variable_sets WHERE id = ?1",
                [set_id],
                |row| row.get(0),
            )
            .optional()?;
        let Some(prompt_id) = prompt_id else { return Ok(()) };

        let was_active: i64 = self.conn.query_row(
            "SELECT is_active FROM variable_sets WHERE id = ?1",
            [set_id],
            |row| row.get(0),
        )?;

        // Foreign keys are not enforced (no PRAGMA foreign_keys=ON), so delete
        // the set's values explicitly.
        self.conn.execute("DELETE FROM prompt_variables WHERE set_id = ?1", [set_id])?;
        self.conn.execute("DELETE FROM variable_sets WHERE id = ?1", [set_id])?;

        if was_active == 1 {
            let next: Option<i64> = self
                .conn
                .query_row(
                    "SELECT id FROM variable_sets WHERE prompt_id = ?1 ORDER BY created_at DESC, id DESC LIMIT 1",
                    [prompt_id],
                    |row| row.get(0),
                )
                .optional()?;
            if let Some(next_id) = next {
                self.set_active_variable_set(prompt_id, next_id)?;
            }
        }
        Ok(())
    }

    /// The prompt's active set, creating a "Default" set (active) if it has
    /// none. Used by the migration backfill so pre-feature values get a home.
    fn get_or_create_default_set(&self, prompt_id: i64) -> Result<i64> {
        let active: Option<i64> = self
            .conn
            .query_row(
                "SELECT id FROM variable_sets WHERE prompt_id = ?1 AND is_active = 1 ORDER BY id LIMIT 1",
                [prompt_id],
                |row| row.get(0),
            )
            .optional()?;
        if let Some(id) = active {
            return Ok(id);
        }
        let first: Option<i64> = self
            .conn
            .query_row(
                "SELECT id FROM variable_sets WHERE prompt_id = ?1 ORDER BY created_at, id LIMIT 1",
                [prompt_id],
                |row| row.get(0),
            )
            .optional()?;
        if let Some(id) = first {
            self.set_active_variable_set(prompt_id, id)?;
            return Ok(id);
        }
        self.create_variable_set(prompt_id, "Default")
    }

    fn row_to_prompt(row: &Row) -> Result<Prompt> {
        Ok(Prompt {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            category: row.get(3)?,
            tags: row.get(4)?,
            description: row.get(5)?,
            icon: row.get(6)?,
            is_favorite: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            deleted_at: row.get(10)?,
        })
    }

    fn prompt_filter_sql(
        search: Option<&str>,
        category: Option<&str>,
        tag: Option<&str>,
        favorites_only: bool,
    ) -> (String, Vec<String>) {
        let mut clauses: Vec<&str> = vec!["deleted_at IS NULL"];
        let mut params: Vec<String> = Vec::new();

        if let Some(s) = search.map(str::trim).filter(|s| !s.is_empty()) {
            clauses.push(
                "(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE)",
            );
            let like = format!("%{}%", s);
            params.push(like.clone());
            params.push(like.clone());
            params.push(like);
        }
        if let Some(c) = category.filter(|c| !c.is_empty()) {
            clauses.push("category = ?");
            params.push(c.to_string());
        }
        if let Some(t) = tag.map(str::trim).filter(|t| !t.is_empty()) {
            clauses.push("(',' || replace(tags, ' ', '') || ',') LIKE ?");
            params.push(format!("%,{},%", t));
        }
        if favorites_only {
            clauses.push("is_favorite = 1");
        }

        (clauses.join(" AND "), params)
    }

    pub fn create_prompt(
        &self,
        title: &str,
        content: &str,
        category: Option<&str>,
        tags: Option<&str>,
        description: Option<&str>,
        icon: Option<&str>,
    ) -> Result<Prompt> {
        self.conn.execute(
            "INSERT INTO prompts (title, content, category, tags, description, icon)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![title, content, category, tags, description, icon],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_prompt(id)
    }

    pub fn duplicate_prompt(&self, id: i64) -> Result<Prompt> {
        let original = self.get_prompt(id)?;
        let new_title = format!("{} (Copy)", original.title);
        self.create_prompt(
            &new_title,
            &original.content,
            original.category.as_deref(),
            original.tags.as_deref(),
            original.description.as_deref(),
            original.icon.as_deref(),
        )
    }

    pub fn get_all_prompts(&self) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE deleted_at IS NULL ORDER BY updated_at DESC",
        )?;

        let prompts = stmt
            .query_map([], Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(prompts)
    }

    pub fn get_prompt(&self, id: i64) -> Result<Prompt> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE id = ?1 AND deleted_at IS NULL",
        )?;

        let prompt = stmt.query_row([id], Self::row_to_prompt)?;
        Ok(prompt)
    }

    pub fn update_prompt(
        &self,
        id: i64,
        title: Option<&str>,
        content: Option<&str>,
        category: Option<&str>,
        tags: Option<&str>,
        description: Option<&str>,
        icon: Option<&str>,
    ) -> Result<()> {
        let mut updates: Vec<String> = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(t) = title {
            updates.push("title = ?".to_string());
            params.push(Box::new(t.to_string()));
        }
        if let Some(c) = content {
            updates.push("content = ?".to_string());
            params.push(Box::new(c.to_string()));
        }
        if let Some(cat) = category {
            updates.push("category = ?".to_string());
            params.push(Box::new(cat.to_string()));
        }
        if let Some(t) = tags {
            updates.push("tags = ?".to_string());
            params.push(Box::new(t.to_string()));
        }
        if let Some(d) = description {
            updates.push("description = ?".to_string());
            params.push(Box::new(d.to_string()));
        }
        if let Some(i) = icon {
            updates.push("icon = ?".to_string());
            params.push(Box::new(i.to_string()));
        }

        if updates.is_empty() {
            return Ok(());
        }

        updates.push("updated_at = CURRENT_TIMESTAMP".to_string());

        let sql = format!("UPDATE prompts SET {} WHERE id = ?", updates.join(", "));
        params.push(Box::new(id));

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        self.conn.execute(&sql, &*param_refs)?;
        Ok(())
    }

    pub fn delete_prompt(&self, id: i64) -> Result<()> {
        // Soft delete: set deleted_at timestamp
        self.conn
            .execute("UPDATE prompts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?1 AND deleted_at IS NULL", [id])?;
        Ok(())
    }

    pub fn restore_prompt(&self, id: i64) -> Result<()> {
        self.conn
            .execute("UPDATE prompts SET deleted_at = NULL WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn permanently_delete_prompt(&self, id: i64) -> Result<()> {
        // The legacy `prompts_fts` FTS5 table and its triggers are dropped in init()
        // (they fired on every write to `prompts` and surfaced FTS5's "disk I/O
        // error" / SQLITE_IOERR, silently blocking prompt creation). init() runs on
        // every app start, so the table is gone by the time this is called — no
        // FTS sync needed here. Keeping this as a plain DELETE means empty_trash's
        // loop can't be aborted by a broken FTS write on databases that pre-date
        // the migration.
        // Foreign keys aren't enforced (no PRAGMA foreign_keys=ON), so remove
        // the prompt's variable sets and values explicitly; they would otherwise
        // linger after the prompt row is gone.
        self.conn
            .execute("DELETE FROM variable_sets WHERE prompt_id = ?1", [id])?;
        self.conn
            .execute("DELETE FROM prompt_variables WHERE prompt_id = ?1", [id])?;
        self.conn
            .execute("DELETE FROM prompts WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_trashed_prompts(&self) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC",
        )?;

        let prompts = stmt
            .query_map([], Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(prompts)
    }

    pub fn get_trash_count(&self) -> Result<i64> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM prompts WHERE deleted_at IS NOT NULL", [], |row| row.get(0))?;
        Ok(count)
    }

    pub fn purge_expired_prompts(&self, days: i64) -> Result<i64> {
        // Permanently delete prompts that have been in trash longer than specified days
        let mut stmt = self.conn.prepare(
            "SELECT id FROM prompts WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', ?1)",
        )?;

        let ids: Vec<i64> = stmt
            .query_map([format!("-{} days", days)], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();

        let count = ids.len() as i64;
        for id in ids {
            self.permanently_delete_prompt(id)?;
        }

        Ok(count)
    }

    pub fn empty_trash(&self) -> Result<i64> {
        // Atomic bulk delete of every soft-deleted prompt.
        //
        // The previous implementation deleted rows one-by-one inside a loop.
        // That aborted on the first failure (e.g. a stray row referencing a
        // now-missing parent under a non-cascading FK) and left the trash in a
        // partially-emptied state. Doing a single DELETE inside an explicit
        // transaction is all-or-nothing: either every trashed row is removed and
        // the count is reported, or the transaction rolls back and the original
        // rusqlite error propagates to the command layer (which maps it to a
        // String and rejects the invoke() promise, surfacing it to the user).
        //
        // prompt_versions has ON DELETE CASCADE on prompt_id, and agents has
        // ON DELETE SET NULL, so a top-level DELETE FROM prompts correctly
        // handles related rows without touching the unrelated `skills` table.
        let tx = self.conn.unchecked_transaction()?;
        let n = tx.execute("DELETE FROM prompts WHERE deleted_at IS NOT NULL", [])?;
        tx.commit()?;
        Ok(n as i64)
    }

    pub fn search_prompts(&self, query: &str) -> Result<Vec<Prompt>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts
             WHERE deleted_at IS NULL AND title LIKE ?1
             ORDER BY title ASC",
        )?;

        let prompts = stmt
            .query_map([search_pattern], Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(prompts)
    }

    /// Append prompt hits matching `cond` (a SQL fragment with one bound param)
    /// to `hits`, skipping prompts already collected via `seen`. Used by
    /// `global_search` to rank matches: exact title, title prefix, title
    /// contains, then body/description contains.
    fn collect_prompt_matches(
        &self,
        cond: &str,
        param: &str,
        query: &str,
        seen: &mut std::collections::HashSet<i64>,
        hits: &mut Vec<SearchHit>,
    ) -> Result<()> {
        let sql = format!(
            "SELECT id, title, content, category FROM prompts \
             WHERE deleted_at IS NULL AND ({cond}) ORDER BY updated_at DESC"
        );
        let mut stmt = self.conn.prepare(&sql)?;
        let rows = stmt.query_map([param], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })?;
        for row in rows {
            let (id, title, content, category) = row?;
            if seen.insert(id) {
                hits.push(SearchHit {
                    id: id.to_string(),
                    kind: "prompt".to_string(),
                    title,
                    subtitle: category,
                    snippet: Some(excerpt(&content, query, 120)),
                });
            }
        }
        Ok(())
    }

    /// Global text search across prompts, categories and tags (all denormalised
    /// into the `prompts` table). Returns up to `limit` hits, ranked:
    /// prompts (exact title → title prefix → title contains → body/description
    /// contains) → categories → tags. Trashed prompts are excluded. An empty or
    /// whitespace-only query returns an empty Vec.
    pub fn global_search(&self, query: &str, limit: usize) -> Result<Vec<SearchHit>> {
        if query.trim().is_empty() || limit == 0 {
            return Ok(Vec::new());
        }

        let mut hits: Vec<SearchHit> = Vec::new();
        let mut seen_prompts: std::collections::HashSet<i64> = std::collections::HashSet::new();
        let prefix = format!("{}%", query);
        let contains = format!("%{}%", query);

        // Prompts, strongest match bucket first. LIKE is case-insensitive for
        // ASCII in SQLite by default (same pattern `search_prompts` uses).
        let conds: &[(&str, &str)] = &[
            ("title = ?1 COLLATE NOCASE", query),
            ("title LIKE ?1", &prefix),
            ("title LIKE ?1", &contains),
            ("(content LIKE ?1 OR description LIKE ?1)", &contains),
        ];
        for (cond, param) in conds {
            self.collect_prompt_matches(cond, param, query, &mut seen_prompts, &mut hits)?;
            if hits.len() >= limit {
                break;
            }
        }

        // Categories (distinct names stored on the prompts table).
        if hits.len() < limit {
            let mut stmt = self.conn.prepare(
                "SELECT DISTINCT category FROM prompts \
                 WHERE category IS NOT NULL AND category != '' AND deleted_at IS NULL \
                 AND category LIKE ?1 ORDER BY category",
            )?;
            let rows = stmt.query_map([&contains], |row| row.get::<_, String>(0))?;
            for row in rows {
                let name = row?;
                hits.push(SearchHit {
                    id: name.clone(),
                    kind: "category".to_string(),
                    title: name,
                    subtitle: None,
                    snippet: None,
                });
                if hits.len() >= limit {
                    break;
                }
            }
        }

        // Tags (comma-separated inside prompts.tags).
        if hits.len() < limit {
            let mut seen_tags: std::collections::HashSet<String> = std::collections::HashSet::new();
            let mut stmt = self.conn.prepare(
                "SELECT tags FROM prompts \
                 WHERE tags IS NOT NULL AND tags != '' AND deleted_at IS NULL \
                 AND tags LIKE ?1",
            )?;
            let rows = stmt.query_map([&contains], |row| row.get::<_, String>(0))?;
            let ql = query.to_lowercase();
            for row in rows {
                for candidate in row?.split(',').map(|t| t.trim()).filter(|t| !t.is_empty()) {
                    if candidate.to_lowercase().contains(&ql) && seen_tags.insert(candidate.to_string())
                    {
                        hits.push(SearchHit {
                            id: candidate.to_string(),
                            kind: "tag".to_string(),
                            title: candidate.to_string(),
                            subtitle: None,
                            snippet: None,
                        });
                        if hits.len() >= limit {
                            break;
                        }
                    }
                }
                if hits.len() >= limit {
                    break;
                }
            }
        }

        hits.truncate(limit);
        Ok(hits)
    }

    pub fn get_prompts_by_category(&self, category: &str) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE category = ?1 AND deleted_at IS NULL ORDER BY updated_at DESC",
        )?;

        let prompts = stmt
            .query_map([category], Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(prompts)
    }

    pub fn get_prompts_page(
        &self,
        limit: i64,
        offset: i64,
        search: Option<&str>,
        category: Option<&str>,
        tag: Option<&str>,
        favorites_only: bool,
        sort: &str,
    ) -> Result<Page<Prompt>> {
        let limit = limit.clamp(1, 200);
        let offset = offset.max(0);
        let (where_sql, params) = Self::prompt_filter_sql(search, category, tag, favorites_only);

        let total: i64 = self.conn.query_row(
            &format!("SELECT COUNT(*) FROM prompts WHERE {}", where_sql),
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )?;

        let order = match sort {
            "updated_asc" => "updated_at ASC",
            "created_desc" => "created_at DESC",
            "created_asc" => "created_at ASC",
            "title_asc" => "title COLLATE NOCASE ASC",
            "title_desc" => "title COLLATE NOCASE DESC",
            _ => "updated_at DESC",
        };

        let sql = format!(
            "SELECT id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE {} ORDER BY {} LIMIT ? OFFSET ?",
            where_sql, order
        );
        let mut page_params = params;
        page_params.push(limit.to_string());
        page_params.push(offset.to_string());

        let mut stmt = self.conn.prepare(&sql)?;
        let items = stmt
            .query_map(rusqlite::params_from_iter(page_params.iter()), Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(Page { items, total })
    }

    pub fn get_favorites_page(
        &self,
        limit: i64,
        offset: i64,
        search: Option<&str>,
        sort: &str,
    ) -> Result<Page<Prompt>> {
        self.get_prompts_page(limit, offset, search, None, None, true, sort)
    }

    pub fn get_categories(&self) -> Result<Vec<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT DISTINCT category FROM prompts WHERE category IS NOT NULL AND deleted_at IS NULL ORDER BY category")?;

        let categories = stmt
            .query_map([], |row| row.get::<_, String>(0))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(categories)
    }

    pub fn get_prompts_count(&self) -> Result<i64> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM prompts WHERE deleted_at IS NULL", [], |row| row.get(0))?;
        Ok(count)
    }

    pub fn get_categories_count(&self) -> Result<i64> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(DISTINCT category) FROM prompts WHERE category IS NOT NULL AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_tags_count(&self) -> Result<i64> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM prompts WHERE tags IS NOT NULL AND tags != '' AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_category_counts(&self) -> Result<Vec<CategoryCount>> {
        let mut stmt = self.conn.prepare(
            "SELECT category, COUNT(*) as count
             FROM prompts
             WHERE category IS NOT NULL AND deleted_at IS NULL
             GROUP BY category
             ORDER BY count DESC",
        )?;

        let counts = stmt
            .query_map([], |row| {
                Ok(CategoryCount {
                    category: row.get(0)?,
                    count: row.get(1)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(counts)
    }

    pub fn get_categories_page(
        &self,
        limit: i64,
        offset: i64,
        search: Option<&str>,
        sort: &str,
    ) -> Result<Page<CategoryCount>> {
        let limit = limit.clamp(1, 200);
        let offset = offset.max(0);
        let mut clauses: Vec<&str> = vec!["category IS NOT NULL", "deleted_at IS NULL"];
        let mut params: Vec<String> = Vec::new();
        if let Some(s) = search.map(str::trim).filter(|s| !s.is_empty()) {
            clauses.push("category LIKE ? COLLATE NOCASE");
            params.push(format!("%{}%", s));
        }
        let where_sql = clauses.join(" AND ");

        let total: i64 = self.conn.query_row(
            &format!(
                "SELECT COUNT(DISTINCT category) FROM prompts WHERE {}",
                where_sql
            ),
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )?;

        let order = match sort {
            "name_desc" => "category DESC",
            "count_desc" => "count DESC",
            "count_asc" => "count ASC",
            _ => "category ASC",
        };

        let sql = format!(
            "SELECT category, COUNT(*) as count
             FROM prompts
             WHERE {}
             GROUP BY category
             ORDER BY {} LIMIT ? OFFSET ?",
            where_sql, order
        );
        let mut page_params = params;
        page_params.push(limit.to_string());
        page_params.push(offset.to_string());

        let mut stmt = self.conn.prepare(&sql)?;
        let items = stmt
            .query_map(rusqlite::params_from_iter(page_params.iter()), |row| {
                Ok(CategoryCount {
                    category: row.get(0)?,
                    count: row.get(1)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(Page { items, total })
    }

    pub fn get_tags_page(
        &self,
        limit: i64,
        offset: i64,
        search: Option<&str>,
        sort: &str,
    ) -> Result<Page<TagCount>> {
        let limit = limit.clamp(1, 200);
        let offset = offset.max(0);

        let mut stmt = self.conn.prepare(
            "SELECT tags FROM prompts WHERE tags IS NOT NULL AND tags != '' AND deleted_at IS NULL",
        )?;
        let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;

        let mut counts: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        for row in rows {
            for tag in row?.split(',').map(|t| t.trim()).filter(|t| !t.is_empty()) {
                *counts.entry(tag.to_string()).or_insert(0) += 1;
            }
        }

        let needle = search
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_lowercase);
        let mut items: Vec<TagCount> = counts
            .into_iter()
            .filter(|(tag, _)| {
                needle
                    .as_deref()
                    .map_or(true, |q| tag.to_lowercase().contains(q))
            })
            .map(|(tag, count)| TagCount { tag, count })
            .collect();
        let total = items.len() as i64;

        match sort {
            "name_desc" => items.sort_by(|a, b| b.tag.cmp(&a.tag)),
            "count_desc" => items.sort_by(|a, b| {
                b.count
                    .cmp(&a.count)
                    .then_with(|| a.tag.cmp(&b.tag))
            }),
            "count_asc" => items.sort_by(|a, b| {
                a.count
                    .cmp(&b.count)
                    .then_with(|| a.tag.cmp(&b.tag))
            }),
            _ => items.sort_by(|a, b| a.tag.cmp(&b.tag)),
        }

        let start = offset as usize;
        let items = items
            .into_iter()
            .skip(start)
            .take(limit as usize)
            .collect();

        Ok(Page { items, total })
    }

    pub fn toggle_favorite(&self, id: i64) -> Result<bool> {
        self.conn.execute(
            "UPDATE prompts SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
            [id],
        )?;
        let is_favorite: i64 = self.conn.query_row(
            "SELECT is_favorite FROM prompts WHERE id = ?1",
            [id],
            |row| row.get(0),
        )?;
        Ok(is_favorite == 1)
    }

    pub fn get_active_prompts_count(&self) -> Result<i64> {
        // Active = created within last 30 days or updated within last 30 days
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM prompts WHERE updated_at >= datetime('now', '-30 days') AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_avg_tokens_per_prompt(&self) -> Result<f64> {
        // Approximate token count: ~4 chars per token (rough estimate)
        let result: f64 = self.conn.query_row(
            "SELECT COALESCE(AVG(LENGTH(content)), 0.0) FROM prompts WHERE deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(result / 4.0)
    }

    pub fn get_favorites_count(&self) -> Result<i64> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM prompts WHERE is_favorite = 1 AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_new_this_week_count(&self) -> Result<i64> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM prompts WHERE created_at >= datetime('now', '-7 days') AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_most_popular_category(&self) -> Result<Option<String>> {
        let result: Option<String> = self.conn.query_row(
            "SELECT category FROM prompts WHERE category IS NOT NULL AND deleted_at IS NULL GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1",
            [],
            |row| row.get(0),
        )?;
        Ok(result)
    }

    pub fn get_agents_count(&self) -> Result<i64> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM agents", [], |row| row.get(0))?;
        Ok(count)
    }

    pub fn get_skills_count(&self) -> Result<i64> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM skills", [], |row| row.get(0))?;
        Ok(count)
    }

    pub fn add_category(&self, category: &str) -> Result<()> {
        // Check if category already exists
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM prompts WHERE category = ?1)",
            [category],
            |row| row.get(0),
        )?;

        if !exists {
            // Create a placeholder prompt with the new category
            self.conn.execute(
                "INSERT INTO prompts (title, content, category, tags, description)
                 VALUES ('Untitled', '', ?1, NULL, NULL)",
                rusqlite::params![category],
            )?;
        }

        Ok(())
    }

    pub fn delete_category(&self, category: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE prompts SET category = NULL WHERE category = ?1",
            [category],
        )?;
        // Drop the category's custom icon so it doesn't linger orphaned.
        self.conn.execute(
            "DELETE FROM entity_icons WHERE entity_type = 'category' AND entity_name = ?1",
            [category],
        )?;
        Ok(())
    }

    pub fn rename_category(&self, old_name: &str, new_name: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE prompts SET category = ?1, updated_at = CURRENT_TIMESTAMP WHERE category = ?2",
            rusqlite::params![new_name, old_name],
        )?;
        // Carry the category's custom icon over to the new name.
        self.conn.execute(
            "UPDATE entity_icons SET entity_name = ?1 WHERE entity_type = 'category' AND entity_name = ?2",
            rusqlite::params![new_name, old_name],
        )?;
        Ok(())
    }

    /// Upsert the icon for a named entity. `entity_type` is "category" or "tag".
    pub fn set_entity_icon(&self, entity_type: &str, entity_name: &str, icon: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO entity_icons (entity_type, entity_name, icon) VALUES (?1, ?2, ?3)
             ON CONFLICT(entity_type, entity_name) DO UPDATE SET icon = excluded.icon",
            rusqlite::params![entity_type, entity_name, icon],
        )?;
        Ok(())
    }

    /// Remove a custom icon so the entity falls back to its default.
    pub fn clear_entity_icon(&self, entity_type: &str, entity_name: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM entity_icons WHERE entity_type = ?1 AND entity_name = ?2",
            rusqlite::params![entity_type, entity_name],
        )?;
        Ok(())
    }

    /// Upsert the accent color for a named entity. `entity_type` is
    /// "category" or "tag". The icon is written as an empty string (the
    /// frontend treats that as "no custom icon") because icon is NOT NULL in
    /// databases created before the color column existed.
    pub fn set_entity_color(&self, entity_type: &str, entity_name: &str, color: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO entity_icons (entity_type, entity_name, icon, color) VALUES (?1, ?2, '', ?3)
             ON CONFLICT(entity_type, entity_name) DO UPDATE SET color = excluded.color",
            rusqlite::params![entity_type, entity_name, color],
        )?;
        Ok(())
    }

    /// Remove a custom color so the entity falls back to the theme accent.
    pub fn clear_entity_color(&self, entity_type: &str, entity_name: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE entity_icons SET color = NULL WHERE entity_type = ?1 AND entity_name = ?2",
            rusqlite::params![entity_type, entity_name],
        )?;
        Ok(())
    }

    /// All custom icons for one entity type, as (name, icon) pairs.
    pub fn get_entity_icons(&self, entity_type: &str) -> Result<Vec<EntityIcon>> {
        let mut stmt = self.conn.prepare(
            "SELECT entity_name, icon, color FROM entity_icons WHERE entity_type = ?1",
        )?;
        let icons = stmt
            .query_map([entity_type], |row| {
                Ok(EntityIcon {
                    name: row.get(0)?,
                    icon: row.get(1)?,
                    color: row.get(2)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(icons)
    }

    // Version control methods
    pub fn save_prompt_version(
        &self,
        prompt_id: i64,
        title: &str,
        content: &str,
        category: Option<&str>,
        tags: Option<&str>,
        description: Option<&str>,
        message: Option<&str>,
    ) -> Result<PromptVersion> {
        // Get the next version number for this prompt
        let version_number: i64 = self.conn.query_row(
            "SELECT COALESCE(MAX(version_number), 0) + 1 FROM prompt_versions WHERE prompt_id = ?1",
            [prompt_id],
            |row| row.get(0),
        )?;

        self.conn.execute(
            "INSERT INTO prompt_versions (prompt_id, version_number, title, content, category, tags, description, message)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![prompt_id, version_number, title, content, category, tags, description, message],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_prompt_version(id)
    }

    pub fn get_prompt_version(&self, id: i64) -> Result<PromptVersion> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt_id, version_number, title, content, category, tags, description, message, created_at
             FROM prompt_versions WHERE id = ?1",
        )?;

        let version = stmt.query_row([id], |row| {
            Ok(PromptVersion {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                version_number: row.get(2)?,
                title: row.get(3)?,
                content: row.get(4)?,
                category: row.get(5)?,
                tags: row.get(6)?,
                description: row.get(7)?,
                message: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;
        Ok(version)
    }

    pub fn get_prompt_versions(&self, prompt_id: i64) -> Result<Vec<PromptVersion>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt_id, version_number, title, content, category, tags, description, message, created_at
             FROM prompt_versions WHERE prompt_id = ?1 ORDER BY version_number DESC",
        )?;

        let versions = stmt
            .query_map([prompt_id], |row| {
                Ok(PromptVersion {
                    id: row.get(0)?,
                    prompt_id: row.get(1)?,
                    version_number: row.get(2)?,
                    title: row.get(3)?,
                    content: row.get(4)?,
                    category: row.get(5)?,
                    tags: row.get(6)?,
                    description: row.get(7)?,
                    message: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(versions)
    }

    pub fn delete_prompt_version(&self, id: i64) -> Result<()> {
        self.conn
            .execute("DELETE FROM prompt_versions WHERE id = ?1", [id])?;
        Ok(())
    }

    /// Rename a version's label. Reuses the `message` column as the
    /// editable label (NULL/empty clears it).
    pub fn rename_prompt_version(&self, id: i64, message: Option<&str>) -> Result<PromptVersion> {
        self.conn.execute(
            "UPDATE prompt_versions SET message = ?1 WHERE id = ?2",
            rusqlite::params![message, id],
        )?;
        self.get_prompt_version(id)
    }

    /// Seed the demo library. Bumping DEMO_SEED_VERSION wipes the previous demo
    /// content and reseeds, so an existing dev database picks up new demo data
    /// instead of being skipped by the old "only seed when empty" check.
    pub fn seed_demo_prompts(&self) -> Result<()> {
        const DEMO_SEED_VERSION: i64 = 2;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
            [],
        )?;

        let seeded: i64 = self
            .conn
            .query_row(
                "SELECT CAST(value AS INTEGER) FROM app_meta WHERE key = 'demo_seed_version'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if seeded >= DEMO_SEED_VERSION {
            return Ok(());
        }

        // Replace any earlier demo content. Child rows are removed explicitly
        // because ON DELETE CASCADE only fires when foreign keys are enabled.
        self.conn.execute("DELETE FROM prompt_variables", [])?;
        self.conn.execute("DELETE FROM variable_sets", [])?;
        self.conn.execute("DELETE FROM prompt_versions", [])?;
        self.conn.execute("DELETE FROM prompts", [])?;
        self.conn
            .execute("DELETE FROM sqlite_sequence WHERE name IN ('prompts', 'prompt_versions', 'variable_sets', 'prompt_variables')", [])
            .ok();

        for demo in demo::all() {
            let created = format!("-{} days", demo.days_ago);
            self.conn.execute(
                "INSERT INTO prompts (title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now', ?7), datetime('now', ?7), NULL)",
                rusqlite::params![
                    demo.title,
                    demo.content,
                    demo.category,
                    demo.tags,
                    demo.description,
                    if demo.is_favorite { 1 } else { 0 },
                    created,
                ],
            )?;
            let prompt_id = self.conn.last_insert_rowid();

            for set in demo.var_sets {
                let set_id = self.create_variable_set(prompt_id, set.name)?;
                for (name, value) in set.values {
                    self.upsert_prompt_variable(prompt_id, set_id, name, value)?;
                }
            }

            for version in demo.versions {
                self.save_prompt_version(
                    prompt_id,
                    demo.title,
                    version.content,
                    Some(demo.category),
                    Some(demo.tags),
                    Some(demo.description),
                    Some(version.message),
                )?;
            }

            if demo.trashed {
                self.conn.execute(
                    "UPDATE prompts SET deleted_at = datetime('now', '-2 days') WHERE id = ?1",
                    [prompt_id],
                )?;
            }
        }

        self.conn.execute(
            "INSERT INTO app_meta (key, value) VALUES ('demo_seed_version', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [DEMO_SEED_VERSION.to_string()],
        )?;

        Ok(())
    }
}
