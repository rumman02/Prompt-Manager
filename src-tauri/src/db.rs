use rusqlite::{Connection, Result, Row};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prompt {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub is_favorite: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
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

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self> {
        let path = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir")
            .join("prompts.db");

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&path)?;
        Ok(Self { conn })
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

        Ok(())
    }

    fn row_to_prompt(row: &Row) -> Result<Prompt> {
        Ok(Prompt {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            category: row.get(3)?,
            tags: row.get(4)?,
            description: row.get(5)?,
            is_favorite: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            deleted_at: row.get(9)?,
        })
    }

    pub fn create_prompt(
        &self,
        title: &str,
        content: &str,
        category: Option<&str>,
        tags: Option<&str>,
        description: Option<&str>,
    ) -> Result<Prompt> {
        self.conn.execute(
            "INSERT INTO prompts (title, content, category, tags, description)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![title, content, category, tags, description],
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
        )
    }

    pub fn get_all_prompts(&self) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at
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
            "SELECT id, title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at
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
        // prompts_fts (the legacy FTS5 full-text index) is dropped in init() because
        // its triggers fired on every write to `prompts` and FTS5 surfaced that as
        // "disk I/O error" (SQLITE_IOERR), silently blocking prompt creation. The
        // table may still exist on databases that pre-date the migration, so only
        // write to it when present; either way, always remove the row itself.
        let fts_exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'prompts_fts')",
            [],
            |row| row.get(0),
        )?;
        if fts_exists {
            let _ = self.conn.execute(
                "INSERT INTO prompts_fts(prompts_fts, rowid, title, content, description)
                 VALUES ('delete', ?1, '', '', '')",
                [id],
            );
        }
        self.conn
            .execute("DELETE FROM prompts WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_trashed_prompts(&self) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at
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
        // Get all trashed prompt IDs
        let mut stmt = self.conn.prepare(
            "SELECT id FROM prompts WHERE deleted_at IS NOT NULL",
        )?;

        let ids: Vec<i64> = stmt
            .query_map([], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();

        let count = ids.len() as i64;
        for id in ids {
            self.permanently_delete_prompt(id)?;
        }

        Ok(count)
    }

    pub fn search_prompts(&self, query: &str) -> Result<Vec<Prompt>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at
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

    pub fn get_prompts_by_category(&self, category: &str) -> Result<Vec<Prompt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, category, tags, description, is_favorite, created_at, updated_at, deleted_at
             FROM prompts WHERE category = ?1 AND deleted_at IS NULL ORDER BY updated_at DESC",
        )?;

        let prompts = stmt
            .query_map([category], Self::row_to_prompt)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(prompts)
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
        Ok(())
    }

    pub fn rename_category(&self, old_name: &str, new_name: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE prompts SET category = ?1, updated_at = CURRENT_TIMESTAMP WHERE category = ?2",
            rusqlite::params![new_name, old_name],
        )?;
        Ok(())
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

    pub fn seed_demo_prompts(&self) -> Result<()> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM prompts", [], |row| row.get(0))?;
        if count > 0 {
            return Ok(());
        }

        let demo_prompts: Vec<(&str, &str, Option<&str>, Option<&str>, Option<&str>)> = vec![
            (
                "Code Review Assistant",
                "You are an expert code reviewer. Analyze the following code and provide:\n1. A summary of what the code does\n2. Potential bugs or issues\n3. Performance improvements\n4. Security vulnerabilities\n5. Style and readability suggestions\n\nCode to review:\n```\n{code}\n```",
                Some("Development"),
                Some("code,review,debugging"),
                Some("Reviews code for bugs, performance, security, and style"),
            ),
            (
                "Blog Post Writer",
                "Write a comprehensive blog post about {topic}. The post should:\n- Have an engaging headline\n- Include an introduction that hooks the reader\n- Contain 3-5 main sections with subheadings\n- Use examples and data to support claims\n- End with a strong conclusion and call-to-action\n- Be approximately {word_count} words\n- Target audience: {audience}\n\nTone: {tone}",
                Some("Writing"),
                Some("blog,content,seo"),
                Some("Generates SEO-optimized blog posts with structured sections"),
            ),
            (
                "Data Analysis Explainer",
                "You are a data analyst. Given the following dataset or results, provide:\n1. Key findings and insights\n2. Notable trends or patterns\n3. Potential correlations\n4. Actionable recommendations\n5. Visualizations that would best represent this data\n\nData:\n{data}\n\nContext: {context}\n\nExplain this to a {audience_level} audience.",
                Some("Data Science"),
                Some("data,analysis,insights"),
                Some("Analyzes data and explains findings for different audiences"),
            ),
            (
                "Creative Story Generator",
                "Write a {genre} story with the following elements:\n- Setting: {setting}\n- Main character: {character}\n- Conflict: {conflict}\n- Theme: {theme}\n\nThe story should be approximately {length} words and written in a {style} style. Include vivid descriptions, natural dialogue, and a satisfying resolution.",
                Some("Creative Writing"),
                Some("story,creative,fiction"),
                Some("Generates creative stories with customizable elements"),
            ),
            (
                "Email Campaign Copy",
                "Write a marketing email campaign for {product/service}. Include:\n1. 3 subject line options (A/B/C testing)\n2. Preview text\n3. Engaging opening\n4. Value proposition\n5. Social proof or testimonial placeholder\n6. Clear call-to-action\n7. P.S. line for urgency\n\nTarget audience: {audience}\nTone: {tone}\nGoal: {goal}",
                Some("Marketing"),
                Some("email,campaign,copywriting"),
                Some("Creates marketing email copy with subject lines and CTAs"),
            ),
            (
                "Lesson Plan Creator",
                "Create a detailed lesson plan for teaching {subject} to {grade_level} students.\n\nInclude:\n- Learning objectives (3-5 measurable goals)\n- Materials needed\n- Warm-up activity (5-10 minutes)\n- Main instruction (direct teaching + guided practice)\n- Independent practice activity\n- Assessment/check for understanding\n- Differentiation strategies\n- Extension activities\n- Homework assignment\n\nDuration: {duration}\nStandards: {standards}",
                Some("Education"),
                Some("lesson,teaching,curriculum"),
                Some("Generates structured lesson plans with objectives and activities"),
            ),
            (
                "Meeting Summarizer",
                "Summarize the following meeting transcript/notes and provide:\n1. Key decisions made\n2. Action items (with owners and deadlines)\n3. Open questions or unresolved issues\n4. Next meeting agenda suggestions\n\nMeeting notes:\n{notes}\n\nFormat the output as a professional summary suitable for sharing with stakeholders.",
                Some("Productivity"),
                Some("meeting,summary,notes"),
                Some("Summarizes meetings into decisions, action items, and follow-ups"),
            ),
            (
                "Technical Documentation",
                "Write clear technical documentation for {feature/API}. Include:\n1. Overview and purpose\n2. Prerequisites\n3. Installation/setup instructions\n4. Usage examples with code snippets\n5. Configuration options\n6. Error handling and troubleshooting\n7. FAQ section\n8. Changelog\n\nTarget audience: {audience}\nFormat: Markdown\nTone: Professional but approachable",
                Some("Development"),
                Some("docs,api,technical-writing"),
                Some("Creates comprehensive technical documentation with examples"),
            ),
            (
                "Social Media Content",
                "Create a week's worth of social media content for {platform} about {topic}.\n\nFor each day, provide:\n- Post copy (platform-appropriate length)\n- Hashtag suggestions\n- Visual/image description\n- Engagement question or CTA\n- Best posting time\n\nBrand voice: {tone}\nTarget audience: {audience}\nGoals: {goals}",
                Some("Marketing"),
                Some("social,content,scheduling"),
                Some("Generates weekly social media content calendars"),
            ),
            (
                "SQL Query Optimizer",
                "You are a database optimization expert. Analyze the following SQL query and:\n1. Explain what the query does\n2. Identify performance bottlenecks\n3. Suggest indexes to improve performance\n4. Provide an optimized version\n5. Explain the improvements made\n\nDatabase: {database_type}\nQuery:\n```sql\n{query}\n```\n\nTable schema (if available): {schema}",
                Some("Data Science"),
                Some("sql,database,optimization"),
                Some("Optimizes SQL queries and suggests performance improvements"),
            ),
        ];

        for (title, content, category, tags, description) in demo_prompts {
            self.conn.execute(
                "INSERT INTO prompts (title, content, category, tags, description)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![title, content, category, tags, description],
            )?;
        }

        Ok(())
    }
}
