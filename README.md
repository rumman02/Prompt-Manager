# Prompt Manager

> A desktop app for organizing, editing, and managing AI prompts — with `{{variable}}` substitution, version history, favorites, trash with auto-purge, and an Apple HIG-native UI.

Prompt Manager is a **Tauri 2 desktop application** (React 19 + TypeScript frontend, Rust + SQLite backend) that turns your growing collection of AI prompts into a searchable, taggable, versioned library. Store prompts in **vault folders** of your choosing, fill `{{placeholders}}` with saved value sets, preview compiled Markdown, and copy the finished prompt to your clipboard in one click.

---

## 1. Overview

Writing good AI prompts is iterative work — you draft, tweak, and re-tweak, and the "good" version usually isn't the newest one. Prompt Manager solves three problems that plain text files or chat history can't:

1. **Organization.** Prompts scattered across notes, docs, and chat threads are unrecoverable. Prompt Manager gives every prompt a home in a real folder on disk (a *vault*), with categories, tags, favorites, search, and a trash can.
2. **Reusability.** Prompts are full of blanks — `{{topic}}`, `{{audience}}`, `{{tone}}`. Instead of hand-editing each copy, you define named variables, save named *value sets*, and compile the prompt with values filled in (or exported with unfilled placeholders highlighted so nothing is silently dropped).
3. **History.** You never know when "the old version" was better. Every save can snapshot a prompt into a version history with an editable label, so you can scroll back, compare, and restore.

The app is architected as a Tauri 2 desktop shell: a React frontend renders the UI and talks to a Rust backend through typed `invoke()` commands; the backend owns a per-vault SQLite database (via `rusqlite` with the bundled engine — no external database server required). Everything runs locally; there is no cloud, no account, and no telemetry.

---

## 2. Features

- **Vault-based storage** — prompts live in user-chosen folders on disk. Create, open, switch, rename, and remove vaults; the database (`prompts.db`) is stored *inside* the vault folder with a `.promptmanager/vault.json` marker, so vaults are portable and can live in Dropbox/iCloud-synced directories.
- **Full prompt CRUD** — create, edit, duplicate ("… (Copy)"), soft-delete, restore, and permanently delete prompts with title, content, category, tags, description, and an optional custom icon.
- **`{{variable}}` substitution** — `{{name}}` placeholders are detected live in the editor, highlighted with per-name colors in both the editor overlay and compiled preview, and compiled from saved values.
- **Variable sets** — each prompt can hold multiple named sets of variable values (e.g. "formal", "casual"); exactly one set is active at a time, and the same variable can hold a different value per set.
- **Version history** — save named snapshots of a prompt (`save_prompt_version`), browse them newest-first, rename their labels, and delete them.
- **Favorites** — one-click star toggle plus a dedicated Favorites view.
- **Trash with auto-purge** — soft-deleted prompts go to trash; on startup the app purges anything older than your configurable retention window (days/weeks/months). Manual "empty trash" and per-item permanent delete are also available.
- **Search** — title search (`search_prompts`) wired to a live search bar.
- **Categories & tags** — category cards with per-category prompt counts, tag chips, drill-down navigation (click a category/tag → filtered prompt list with a Back button), plus custom per-entity icons *and* accent colors (a restrained 6-key palette, defaulting to the theme accent).
- **Right-click context menus** — Edit / Delete on category cards and tag chips, matching the hover actions menus.
- **Editor workspace** — a resizable split-pane editor: editable pane, live Markdown preview (GFM via `marked`, sanitized with DOMPurify), variables sidebar, version-history sidebar, and metadata. Pane layouts persist per user.
- **Live prompt statistics** — token/word/sentence/paragraph/variable counts in the editor status bar; dashboard stats (total prompts, active this week, favorites, categories, tags, trash, average tokens per prompt, most popular category).
- **Dashboard** — overview with stats cards; landing page is configurable.
- **Markdown preview** — compiled Markdown rendered safely; unfilled `{{tokens}}` are rendered as dashed "still needs a value" pills without corrupting HTML tags.
- **Apple HIG-native UI** — macOS 14 Sonoma design tokens (light/dark), overlay title bar, SF-font stack, native-feeling modals/tooltips/context menus via Radix UI, and 7 full theme presets (apple, catppuccin, tokyonight, gruvbox, material, github, oled).
- **Theming & settings** — light / dark / system theme mode, 13 accent colors, date formats, UI + editor fonts and sizes, language preference, and trash retention — persisted in `localStorage`.
- **Demo library** — one click seeds 47 realistic prompts (43 active + 4 trashed, 12 favorites, 12 categories, 32 variable sets, 84 variable values, 18 versions) so you can explore the app before adding your own.
- **Clipboard everywhere** — copy a prompt (raw or compiled) via a resilient `copyToClipboard()` helper with Tauri-plugin → Web Clipboard API → `execCommand` fallback.

---

## 3. Architecture

Three layers: the **React frontend**, the **Tauri command bridge**, and the **Rust backend** (database + vault management). The frontend never touches SQL; all persistence flows through typed `invoke()` commands registered in `src-tauri/src/lib.rs`.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + TS)                       │
│                                                                      │
│  App.tsx ── view routing (dashboard / prompts / agents / skills /    │
│  favorites / categories / tags / trash / settings) + drill-down nav  │
│        │                                                             │
│        ├── Sidebar ── nav + category quick-links                      │
│        ├── PromptList/Grid/Table ── sortable list, grid, category     │
│        │        │                       filter dropdown               │
│        ├── PromptEditorPage ── SplitPane (edit | preview |           │
│        │        │                       variables | history | meta)   │
│        ├── PromptViewer ── read-only modal w/ actions menu           │
│        ├── CategoriesPage / TagsPage ── EntityEditDialog + ContextMenu│
│        ├── Favorites / Trash / Settings / Agents / Skills pages      │
│        └── VaultSetupScreen ── first-run vault picker                │
│        │                                                             │
│  hooks (usePrompts, useCategories, useStats, useTrash, useRefresh,   │
│  useResizable, useEntityIcons)  ·  contexts (Settings, Vault)  ·     │
│  lib (utils, clipboard, markdown)  ·  constants (themes, colors, …)  │
└───────────────┬──────────────────────────────────────────────────────┘
                │  invoke("<command>", { args })  →  Result<T, String>
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│              TAURI BRIDGE (src-tauri/src/lib.rs)                     │
│  tauri::generate_handler![ 54 commands ]                             │
│  plugins: tauri-plugin-sql · tauri-plugin-clipboard-manager ·        │
│           tauri-plugin-dialog                                        │
└───────┬───────────────────────────────┬──────────────────────────────┘
        ▼                               ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   db.rs (rusqlite)     │   │  vault.rs                    │
│  per-vault SQLite DB   │   │  registry: app_config_dir/   │
│  tables: prompts,      │   │    vaults.json               │
│  prompt_versions,      │   │  marker: <vault>/.prompt-    │
│  prompt_variables,     │   │    manager/vault.json        │
│  variable_sets,        │   │  active DB = <vault>/        │
│  entity_icons, agents, │   │    prompts.db                │
│  skills, app_meta      │   │                              │
└────────────────────────┘   └──────────────────────────────┘
```

**Data flow at a glance**

1. **Startup** — `main.rs` → `prompt_manager_lib::run()`. The Tauri builder registers three plugins and, in `setup`, checks for an active vault. If one exists, `init_db()` opens `Database::new()` (resolving the active vault's `prompts.db`), runs schema `init()` (CREATE TABLEs + tolerant migrations), and calls `seed_demo_prompts()` (gated by the `demo_seed_version` key in `app_meta`). If no vault exists, the frontend shows `VaultSetupScreen` and DB init is deferred until `create_vault` / `open_vault` / `switch_vault` runs `init_db_schema()`.
2. **Query** — every page loads data by invoking commands (e.g. `get_prompts`, `get_category_counts`); each command constructs a fresh `Database` from the `AppHandle` and maps `rusqlite::Result` errors to `Result<_, String>` for the frontend.
3. **Save** — `PromptEditorPage` submits `create_prompt` / `update_prompt`; variable values go through `save_prompt_variable` (UPSERT per prompt+set+name); snapshots through `save_prompt_version`.
4. **Search/drill-down** — `search_prompts` uses a `LIKE '%query%'` on title; category/tag clicks filter in `App.tsx` (`filteredPrompts`) and/or via `get_prompts_by_category`.

**Key design decisions**

- **SQLite is bundled and local.** `rusqlite` with the `bundled` feature compiles SQLite into the binary — no server, no setup, offline by default.
- **Vaults are just folders.** The app's only global state is the vault registry (`vaults.json` in the app config dir); all prompt data lives in the vault folder, which is why switching vaults reloads the whole window (`window.location.reload()`).
- **Foreign keys are declared but not enforced** (`PRAGMA foreign_keys` is off). The code compensates: cascading deletes are done explicitly (e.g. `permanently_delete_prompt` removes `variable_sets` and `prompt_variables` rows by hand; `delete_variable_set` deletes its values explicitly).
- **`copyToClipboard()` is the single source of truth** for clipboard writes (Tauri plugin → Web API → execCommand), and `renderCompiledMarkdown()` for all Markdown rendering (compile → sanitize with DOMPurify → highlight unfilled tokens on text segments only, never inside tags).
- **Schema migrations are additive and error-tolerant.** `init()` runs `ALTER TABLE ... ADD COLUMN` guarded by `pragma_table_info` checks or `let _ =` (ignore errors) so old databases upgrade in place.

---

## 4. Project Structure

```
prompt-manager/
├── package.json               # npm scripts + frontend dependencies
├── vite.config.ts             # Vite dev server (port 1420, strict), @/ alias
├── tsconfig.json              # TypeScript config, @/* path mapping
├── tailwind.config.js         # Tailwind + HSL design tokens, darkMode: class
├── postcss.config.js          # PostCSS (tailwindcss + autoprefixer)
├── index.html                 # Vite HTML entry
├── src/                       # ── React frontend (TypeScript) ──
│   ├── App.tsx                # Root component: view routing, drill-down nav,
│   │                          #   data loading, AppGate (vault gating)
│   ├── main.tsx               # React entry; suppresses native context menu
│   │                          #   in production (except editable fields)
│   ├── index.css              # Tailwind + Apple HIG HSL design tokens
│   ├── components/
│   │   ├── sidebar.tsx        # Main navigation + category quick-links
│   │   ├── search-bar.tsx     # Live prompt search input
│   │   ├── stats-cards.tsx    # Dashboard stat tiles
│   │   ├── category-chart.tsx # Category distribution chart
│   │   ├── layout/            # Header, PageHeader (title + back button)
│   │   ├── prompts/           # PromptList, PromptGrid, PromptListTable
│   │   │                      #   (sortable columns), PromptCard,
│   │   │                      #   PromptListItem, PromptEditorPage (split-pane
│   │   │                      #   editor), PreviewPanel, VariablesSidebar,
│   │   │                      #   VersionHistorySidebar, PromptViewer,
│   │   │                      #   PromptActionsMenu, HighlightedTextarea,
│   │   │                      #   SplitPane, PanelStatusBar, EmptyPromptsState
│   │   ├── agents/ skills/    # Agent & skill management pages
│   │   ├── categories/        # Category cards w/ icons+colors, edit dialog
│   │   ├── tags/              # Tag chips w/ icons+colors, edit dialog
│   │   ├── favorites/         # Favorites page (list/grid)
│   │   ├── trash/             # Trash page (restore / purge)
│   │   ├── settings/          # Settings page (theme, accent, fonts, trash…)
│   │   ├── vault/             # VaultSetupScreen (first-run vault picker)
│   │   └── ui/                # Base primitives: Button, Card, Modal, Input,
│   │                          #   Dropdown, Select, Tabs, Tooltip, ContextMenu,
│   │                          #   ActionsMenu, EntityEditDialog, IconPicker,
│   │                          #   Icon registry, RenameDialog, EmptyState, …
│   ├── constants/             # colors.ts (resource color keys), nav.ts,
│   │                          #   settings.ts (accent presets, fonts, layouts),
│   │                          #   stats.tsx, themes.ts (7 theme presets)
│   ├── contexts/              # SettingsContext (localStorage persistence,
│   │                          #   CSS-var theming), VaultContext (vault API)
│   ├── hooks/                 # usePrompts, useCategories, useStats,
│   │                          #   useTrash, useRefresh, useResizable,
│   │                          #   useEntityIcons
│   ├── lib/                   # utils.ts (cn, formatDate, compilePrompt,
│   │                          #   getContentStats, hashHue), clipboard.ts
│   │                          #   (copyToClipboard), markdown.ts
│   │                          #   (renderCompiledMarkdown)
│   └── types/                 # PromptRow, CategoryCount, PromptVersion,
│                              #   VariableSet, VaultEntry, VaultStatus
├── src-tauri/                 # ── Rust backend ──
│   ├── Cargo.toml             # Rust deps (tauri 2, rusqlite bundled, …)
│   ├── tauri.conf.json        # Window config, bundle, dev server wiring
│   ├── build.rs               # tauri-build (bundle metadata)
│   ├── capabilities/default.json  # Tauri permissions (clipboard, dialog, drag)
│   ├── icons/                 # App icons (.icns, .ico, .png)
│   ├── src/
│   │   ├── main.rs            # Binary entry → prompt_manager_lib::run()
│   │   ├── lib.rs             # All 54 Tauri command handlers + run()
│   │   ├── db.rs              # SQLite schema, migrations, queries (rusqlite)
│   │   ├── vault.rs           # Vault registry, marker files, active DB path
│   │   └── demo/              # Demo seed data: mod.rs + part1–4.rs
│   │                          #   (47 prompts, structs DemoPrompt/VarSet/Version)
│   └── tests/                 # Rust integration tests (cargo test):
│       │                      #   demo_seed.rs, variable_sets.rs, empty_trash.rs
│       └── (9 tests total)
├── agents.md / AGENTS.md      # Agent instructions for AI coding assistants
├── graphify-out/              # Knowledge-graph artifacts (graph.json, report)
└── dist/                      # Vite production build output
```

---

## 5. Requirements / Prerequisites

| Requirement | Version / Detail |
|---|---|
| Node.js | **v18+** (vite 6, react 19) |
| npm | 9+ (comes with Node) |
| Rust toolchain | Stable (edition 2021); needed for the Tauri backend |
| Tauri system deps | Platform prerequisites per [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/) (Xcode CLT / WebView2 / webkit2gtk) |
| OS | macOS (primary target, titleBarStyle Overlay), Windows, Linux |
| External services | **None** — fully local (SQLite bundled; no network, no accounts) |

The Rust crates in use (`Cargo.toml`):

- `tauri` **2** (default features)
- `tauri-plugin-sql` **2** (feature `sqlite`)
- `tauri-plugin-clipboard-manager` **2**
- `tauri-plugin-dialog` **2**
- `rusqlite` **0.32** (feature `bundled` — SQLite compiled in)
- `uuid` **1** (feature `v4`)
- `chrono` **0.4**, `serde` **1** (derive), `serde_json` **1**

Key frontend dependencies (`package.json`): `react`/`react-dom` **^19.1**, `@tauri-apps/api` **^2**, `@tauri-apps/plugin-clipboard-manager` **^2.3**, `@tauri-apps/plugin-dialog` **^2.7**, `@tauri-apps/plugin-sql` **^2.2**, Radix UI primitives (dialog, dropdown-menu, tabs, tooltip, switch, toggle-group, avatar, label, separator, slot), `marked` **^18**, `dompurify` **^3.4**, `date-fns` **^4.1**, `framer-motion` **^12.9**, `sonner` **^2**, `uuid` **^11**, `@tabler/icons-react` **^3.31**, `lucide-react` **^1.27**, `clsx`, `tailwind-merge`, `class-variance-authority`. Dev: `vite` **^6.3**, `typescript` **^5.8**, `@tauri-apps/cli` **^2**, `tailwindcss` **^3.4**, `@vitejs/plugin-react`.

---

## 6. Installation

```bash
# 1. Clone the repository
git clone <repo-url> prompt-manager
cd prompt-manager

# 2. Install frontend dependencies
npm install

# 3. Run in dev mode (Vite + Tauri webview, hot reload)
npm run tauri:dev

# 4. Or build a production bundle (.app / .dmg / .msi)
npm run tauri:build
```

No environment variables are required. The first run opens the vault setup screen — create or open a folder to become your vault, then the app seeds nothing until you ask (a "load demo prompts" action is available from the Categories page).

---

## 7. Configuration

There are **no environment variables** — configuration is either in `src-tauri/tauri.conf.json` or user settings persisted to `localStorage`.

### 7.1 App config (`src-tauri/tauri.conf.json`)

| Key | Type | Default | Description |
|---|---|---|---|
| `productName` | string | `"Prompt Manager"` | Bundle/product name |
| `version` | string | `"0.1.0"` | App version |
| `identifier` | string | `"com.promptmanager.app"` | Bundle identifier |
| `build.beforeDevCommand` | string | `"npm run dev"` | Command Tauri runs before dev window |
| `build.devUrl` | string | `"http://localhost:1420"` | Vite dev server URL (strict port) |
| `build.beforeBuildCommand` | string | `"npm run build"` | Command before production bundle |
| `build.frontendDist` | string | `"../dist"` | Built frontend directory |
| `app.windows[0].width/height` | number | `1400` / `900` | Default window size |
| `app.windows[0].minWidth/minHeight` | number | `1000` / `600` | Minimum window size |
| `app.windows[0].titleBarStyle` | string | `"Overlay"` | Overlay (hidden) title bar |
| `app.windows[0].hiddenTitle` | boolean | `true` | Hide the title text |
| `app.security.csp` | null | `null` | CSP disabled |
| `bundle.targets` | string | `"all"` | Build all bundle targets |

### 7.2 Tauri capabilities (`src-tauri/capabilities/default.json`)

| Permission | Purpose |
|---|---|
| `core:window:default`, `core:window:allow-start-dragging` | Custom-region window dragging with the overlay title bar |
| `clipboard-manager:allow-write-text`, `clipboard-manager:allow-read-text` | Copy compiled prompts |
| `dialog:default`, `dialog:allow-open`, `dialog:allow-message`, `dialog:allow-confirm` | Folder pickers (vault create/open) and native dialogs |

### 7.3 User settings (UI → `localStorage["prompt-manager-settings"]`)

| Key | Type | Default | Description |
|---|---|---|---|
| `accentColor` | string (hex) | `"#1e293b"` | Accent color; overrides `--primary` at runtime |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Theme mode (system respects `prefers-color-scheme`) |
| `themePreset` | string | `"apple"` | Theme preset id: `apple`, `catppuccin`, `tokyonight`, `gruvbox`, `material`, `github`, `oled` |
| `language` | string (ISO code) | `"en"` | UI language (12 options, e.g. `es`, `fr`, `ja`) |
| `dateFormat` | string | `"MMM d, yyyy"` | Relative-date fallback format |
| `landingPage` | `"dashboard" \| "prompts" \| "categories" \| "tags"` | `"dashboard"` | View shown on startup |
| `trashTimeout` | number | `30` | Auto-purge retention value |
| `trashTimeoutUnit` | `"days" \| "weeks" \| "months"` | `"days"` | Retention unit (weeks→×7, months→×30) |
| `editorLayout` | `LayoutNode \| null` | `null` | Persisted split-pane editor layout (view ids, orientation, sizes) |
| `editorSplitOrientation` | `"h" \| "v"` | `"h"` | Orientation of the next split |
| `fontFamily` | string (CSS stack) | SF Pro system stack | UI font |
| `editorFontFamily` | string (CSS stack) | SF Mono system stack | Editor/monospace font |
| `fontSize` | string (rem) | `"0.875rem"` | Base font size (12–20px options) |

### 7.4 On-disk vault state (not config, but user-visible)

| Path | Description |
|---|---|
| `<vault>/.promptmanager/vault.json` | Vault marker: `{ name, created_at, schema_version: 1 }` — identifies a folder as a vault |
| `<vault>/prompts.db` | The active vault's SQLite database |
| `app_config_dir()/vaults.json` | Global registry: list of vault entries + `active_vault_id` |

---

## 8. Usage

### 8.1 npm scripts

| Command | What it does | Expected output |
|---|---|---|
| `npm run dev` | Vite dev server only (no Tauri) | `VITE v6.x ready in <ms> → Local: http://localhost:1420/` |
| `npm run build` | `tsc` type-check + `vite build` | `✓ built in <ms>`, files emitted to `dist/`; exits non-zero on type errors |
| `npm run preview` | Preview the built frontend | Serves `dist/` on a local URL |
| `npm run tauri` | Tauri CLI passthrough | Tauri CLI help |
| `npm run tauri:dev` | Full Tauri dev (Vite + Rust webview, rebuilds Rust on change) | Launches the native window; Rust compile output on first run |
| `npm run tauri:build` | Production bundle | `.app`/`.dmg` (macOS), `.msi` (Windows), or AppImage/deb (Linux) under `src-tauri/target/release/bundle/` |

### 8.2 Cargo

| Command | What it does |
|---|---|
| `cargo test` (in `src-tauri/`) | Runs the 9 Rust integration tests against real SQLite temp DBs |
| `cargo build` (in `src-tauri/`) | Compiles the Rust backend alone |

### 8.3 Main workflows

**First run (vault setup).** Launch the app → `VaultSetupScreen` appears → click **Create** (pick an empty folder; a non-empty non-vault folder is rejected) or **Open** (pick an existing vault folder). The app writes `.promptmanager/vault.json`, initializes `prompts.db`, and reloads into the app.

**Create a prompt.** Sidebar → Prompts → **Create Prompt** → fill title/content/category/tags → Save. The editor's split pane shows a live preview; `{{name}}` placeholders are highlighted as pills.

**Use variable sets.** In the editor's Variables pane, create a set (e.g. "Formal") and enter values per variable; create more sets and switch the active one — the preview recompiles instantly. `save_prompt_variable` UPSERTs per (prompt, set, name), so values are per-set.

**Save a version.** Save the prompt → snapshot it via the history pane with a message (e.g. "v2: tightened wording"). `save_prompt_version` auto-numbers (`MAX(version_number)+1`) and stores a full copy.

**Favorite / trash.** Star a prompt from the list, card, or viewer → it appears under Favorites. Delete → it soft-deletes (`deleted_at`) into Trash; on next launch, anything older than the retention window is purged automatically (`purge_expired_prompts`).

**Drill down.** Click a category card or tag chip → Prompts list filtered to that entity, sidebar stays lit on Categories/Tags, header shows **Back to Categories / Back to Tags**. Clicking Prompts in the sidebar clears the filter.

**Sort & filter the list.** Click any table header (Title / Category / Content / Updated) to sort — first click ascending, second click descending; use the **All categories** dropdown to filter within the current result set.

**Copy.** Viewer / actions menu → Copy (raw or compiled). Always goes through `copyToClipboard()` (Tauri plugin first).

**Demo content.** Categories page → load demo prompts → `seed_demo_prompts` seeds 47 prompts if the stored `demo_seed_version` in `app_meta` is below the current constant (2).

---

## 9. API / CLI Reference

There is no public CLI other than the npm/cargo scripts above and the Tauri commands below. All backend access is via `invoke("<command>", args)` from `@tauri-apps/api/core`; every command returns `Result<T, String>`.

### 9.1 Prompt commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `create_prompt` | `title`, `content`, `category?`, `tags?`, `description?`, `icon?` | `Prompt` | Insert a new prompt |
| `get_prompts` | — | `Prompt[]` | All non-deleted prompts, newest-updated first |
| `get_prompt` | `id: i64` | `Prompt` | One prompt by id |
| `update_prompt` | `id`, `title?`, `content?`, `category?`, `tags?`, `description?`, `icon?` | `()` | Partial update (only provided fields) |
| `delete_prompt` | `id` | `()` | Soft delete (`deleted_at = now`) |
| `duplicate_prompt` | `id` | `Prompt` | Copy with `" (Copy)"` title suffix |
| `restore_prompt` | `id` | `()` | Clear `deleted_at` |
| `permanently_delete_prompt` | `id` | `()` | Hard delete + cleanup of variable sets/values |
| `get_trashed_prompts` | — | `Prompt[]` | Soft-deleted prompts, newest first |
| `get_trash_count` | — | `i64` | Number of trashed prompts |
| `purge_expired_prompts` | `days: i64` | `i64` | Permanently delete trash older than `days`; returns count |
| `empty_trash` | — | `i64` | Atomic delete of every trashed prompt (transaction); returns count |
| `search_prompts` | `query` | `Prompt[]` | `LIKE %query%` on title, sorted by title |
| `get_prompts_by_category` | `category` | `Prompt[]` | Prompts in a category, newest-updated first |
| `get_prompts_count` | — | `i64` | Active prompt count |
| `get_active_prompts_count` | — | `i64` | Prompts updated within the last 30 days |
| `get_avg_tokens_per_prompt` | — | `f64` | Avg content length ÷ 4 (approx tokens) |
| `get_favorites_count` | — | `i64` | Favorited prompt count |
| `get_new_this_week_count` | — | `i64` | Prompts created in the last 7 days |
| `toggle_favorite` | `id` | `bool` | Flip favorite flag; returns new state |

### 9.2 Category / tag commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `get_categories` | — | `string[]` | Distinct active categories |
| `get_category_counts` | — | `CategoryCount[]` | `{category, count}` ordered by count desc |
| `get_categories_count` | — | `i64` | Distinct category count |
| `get_tags_count` | — | `i64` | Prompts with a non-empty tags value |
| `get_most_popular_category` | — | `string \| null` | Category with most prompts |
| `add_category` | `category` | `()` | Adds a placeholder "Untitled" prompt in the category if new |
| `delete_category` | `category` | `()` | Nulls `category` on prompts + drops its entity icon |
| `rename_category` | `old_name`, `new_name` | `()` | Rewrites category on prompts, carries icon row |
| `set_entity_icon` | `entity_type` ("category"/"tag"), `entity_name`, `icon` | `()` | Upsert custom icon |
| `clear_entity_icon` | `entity_type`, `entity_name` | `()` | Remove custom icon |
| `set_entity_color` | `entity_type`, `entity_name`, `color` | `()` | Upsert accent color key (writes icon as `''`) |
| `clear_entity_color` | `entity_type`, `entity_name` | `()` | Null the stored color |
| `get_entity_icons` | `entity_type` | `EntityIcon[]` | `{name, icon, color}` rows |

### 9.3 Versioning commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `save_prompt_version` | `prompt_id`, `title`, `content`, `category?`, `tags?`, `description?`, `message?` | `PromptVersion` | Snapshot with auto-incremented `version_number` |
| `get_prompt_versions` | `prompt_id` | `PromptVersion[]` | All versions, newest first |
| `delete_prompt_version` | `id` | `()` | Remove a snapshot |
| `rename_prompt_version` | `id`, `message?` | `PromptVersion` | Edit the snapshot label |

### 9.4 Variable commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `save_prompt_variable` | `prompt_id`, `set_id`, `name`, `value` | `()` | UPSERT one variable value for (prompt, set) |
| `get_prompt_variables` | `prompt_id` | `(string,string)[]` | Active set's `(name, value)` pairs |
| `create_variable_set` | `prompt_id`, `name` | `i64` | New set (becomes active if none active); returns set id |
| `list_variable_sets` | `prompt_id` | `(i64,string,bool)[]` | `(id, name, is_active)` by creation order |
| `set_active_variable_set` | `prompt_id`, `set_id` | `()` | Activate one set, deactivate the rest |
| `delete_variable_set` | `set_id` | `()` | Delete set + its values; promotes newest remaining set if it was active |

### 9.5 Vault commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `list_vaults` | — | `VaultEntry[]` | All registered vaults |
| `vault_status` | — | `VaultInfo` | `{active: VaultEntry \| null, needs_setup: bool}` |
| `create_vault` | `path`, `name` | `VaultEntry` | Create folder (must be empty), write marker, init schema, activate |
| `open_vault` | `path` | `VaultEntry` | Open an existing vault folder, activate, init schema |
| `switch_vault` | `id` | `VaultEntry` | Activate a registered vault |
| `rename_vault` | `id`, `name` | `VaultEntry` | Rename entry + update marker file |
| `remove_vault` | `id` | `()` | Forget the vault (does not delete the folder) |
| `reveal_vault` | `id` | `()` | Open the folder in Finder/Explorer/xdg-open |

### 9.6 Misc commands

| Command | Arguments | Returns | Description |
|---|---|---|---|
| `get_agents_count` | — | `i64` | Rows in `agents` |
| `get_skills_count` | — | `i64` | Rows in `skills` |
| `seed_demo_prompts` | — | `()` | (Re)seed the 47-prompt demo library if `demo_seed_version` is stale |

### 9.7 Frontend library exports

| Export | Signature | Purpose |
|---|---|---|
| `cn` | `(...inputs: ClassValue[]) => string` | `clsx` + `tailwind-merge` class combiner |
| `formatDate` | `(dateStr: string) => string` | Relative time ("Just now", "5m ago", "…", date); parses naive SQLite UTC as UTC (appends `Z`) |
| `truncate` | `(str: string, length: number) => string` | Truncate with `…` |
| `compilePrompt` | `(content, Record<string,string>) => {text, unfilled}` | Substitute `{{vars}}`; unfilled names kept literal and reported |
| `getContentStats` | `(text: string) => ContentStats` | tokens (~1.33/word), words, sentences, paragraphs, distinct variables |
| `hashHue` | `(name: string) => number` | Stable per-variable hue (`0–329`) |
| `VARIABLE_TOKEN_RE` | RegExp | Shared `/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g` |
| `copyToClipboard` | `(text: string) => Promise<boolean>` | Tauri plugin → Web API → execCommand fallback; never throws |
| `renderCompiledMarkdown` | `(content, variableValues, opts) => string` | Compile → `marked` GFM → DOMPurify sanitize → highlight unfilled tokens (text segments only) |
| `RenderedMarkdown` | React component | Renders the sanitized compiled HTML |

---

## 10. Data Model

### 10.1 SQLite tables (per vault: `<vault>/prompts.db`)

**`prompts`** — the core entity.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `title` | TEXT NOT NULL | |
| `content` | TEXT NOT NULL | May contain `{{variable}}` placeholders |
| `category` | TEXT NULL | Indexed (`idx_prompts_category`) |
| `tags` | TEXT NULL | Comma-separated string, parsed client-side |
| `description` | TEXT NULL | |
| `icon` | TEXT NULL | Semantic icon-registry key; NULL = default |
| `is_favorite` | INTEGER DEFAULT 0 | 0/1 |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Naive UTC |
| `updated_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Naive UTC; bumped on update/favorite |
| `deleted_at` | DATETIME NULL | NULL = active; set = in trash |

**`prompt_versions`** — full snapshots of a prompt.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `prompt_id` | INTEGER NOT NULL | FK → prompts, ON DELETE CASCADE |
| `version_number` | INTEGER NOT NULL | `MAX(version_number)+1` per prompt |
| `title`, `content`, `category`, `tags`, `description` | TEXT | Snapshot copy |
| `message` | TEXT NULL | Editable label (rename via `rename_prompt_version`) |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

**`variable_sets`** — named collections of variable values per prompt.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `prompt_id` | INTEGER NOT NULL | FK → prompts, ON DELETE CASCADE |
| `name` | TEXT NOT NULL | e.g. "Formal" |
| `is_active` | INTEGER DEFAULT 0 | Exactly one per prompt (in practice) |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

**`prompt_variables`** — one row per (prompt, set, variable).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `prompt_id` | INTEGER NOT NULL | FK → prompts, ON DELETE CASCADE |
| `set_id` | INTEGER NULL | FK → variable_sets, ON DELETE CASCADE; NULL only pre-migration |
| `name` | TEXT NOT NULL | Variable name without braces |
| `value` | TEXT DEFAULT `''` | Saved substitution value |
| `updated_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |
| UNIQUE index | `(prompt_id, set_id, name)` | Enables UPSERT semantics |

**`entity_icons`** — custom icons/colors for named entities (categories, tags — which have no tables of their own).

| Column | Type | Notes |
|---|---|---|
| `entity_type` | TEXT NOT NULL | `"category"` \| `"tag"` |
| `entity_name` | TEXT NOT NULL | |
| `icon` | TEXT NOT NULL | Icon registry key; `''` = no custom icon |
| `color` | TEXT NULL | Resource color key (`accent`/`slate`/`emerald`/`amber`/`rose`/`sky`); NULL = theme accent |
| PK | `(entity_type, entity_name)` | |

**`agents`** — id, `name`, `description`, `prompt_id` (FK → prompts, ON DELETE SET NULL), `created_at`, `updated_at`.

**`skills`** — id, `name`, `description`, `content` (NOT NULL), `created_at`, `updated_at`.

**`app_meta`** — key/value store (key TEXT PK, value TEXT). Used for `demo_seed_version`.

### 10.2 Rust structs

- `Prompt` — mirrors the `prompts` row (serde-serialized to the frontend).
- `PromptVersion` — mirrors `prompt_versions`.
- `CategoryCount { category: String, count: i64 }`.
- `EntityIcon { name, icon, color: Option<String> }`.
- `VaultEntry { id: String (uuid v4), name, path, created_at, last_opened_at: Option<String>, exists: bool }`.
- `VaultRegistry { vaults: Vec<VaultEntry>, active_vault_id: Option<String> }` — persisted to `vaults.json`.
- `VaultInfo { active: Option<VaultEntry>, needs_setup: bool }`.

### 10.3 Frontend types (`src/types/`)

- `PromptRow` — camelCase-mirrors `Prompt` (id, title, content, category, tags, description, icon, is_favorite, created_at, updated_at, deleted_at).
- `CategoryCount`, `PromptVersion`, `VariableSet { id, name, isActive }`, `ViewMode = "list" | "grid"`, `VaultEntry`, `VaultStatus`.

### 10.4 Schema migrations (`db.rs::init`, error-tolerant)

- `ALTER TABLE prompts ADD COLUMN is_favorite …` (ignore errors)
- `ALTER TABLE prompts ADD COLUMN icon …` (ignore errors)
- `ALTER TABLE prompts ADD COLUMN deleted_at …` (ignore errors)
- `RENAME COLUMN collection → category` if `collection` exists (checked via `pragma_table_info`)
- Drops legacy FTS5 `prompts_fts` table + `prompts_ai/ad/au` triggers (they caused `SQLITE_IOERR` on writes)
- `ALTER TABLE entity_icons ADD COLUMN color …` (ignore errors)
- `ALTER TABLE prompt_variables ADD COLUMN set_id …` if missing, rebuilds unique index to `(prompt_id, set_id, name)`, backfills orphaned values into a default "Default" set

---

## 11. Development

### 11.1 Dev environment

```bash
npm install          # frontend deps
npm run tauri:dev    # full dev loop: Vite on :1420 + Tauri webview, Rust rebuilds on change
```

Rust changes require recompilation (handled by `tauri dev`); frontend changes hot-reload via Vite. The dev server binds **strictly** to port 1420 (`vite.config.ts`).

### 11.2 Code layout conventions

- **Frontend**: functional components with hooks, named exports; `interface` for shapes; PascalCase components, camelCase functions, UPPER constants. Import everything from `src/` via the `@/` alias; relative imports within a directory.
- **UI primitives**: extend the existing `src/components/ui/` set (Radix-based); don't reinvent Dialog/Tooltip/Tabs. Keep destructive items styled `text-destructive`.
- **Backend**: each Tauri command in `lib.rs` is a thin wrapper — construct `Database::new(&app_handle)`, call the `db.rs` method, map errors with `.map_err(|e| e.to_string())`. Register every new command in `tauri::generate_handler![...]`.
- **Error surfacing**: commands return `Result<T, String>`; the frontend should surface failures to the user (toast/inline banner), not only `console.error`.
- **Formatting**: no Prettier — match existing style (2-space indent, single quotes, semicolons).

### 11.3 Demo seed data

`src-tauri/src/demo/` holds `DemoPrompt`/`DemoVarSet`/`DemoVersion` structs and `all()` concatenating `PART1`–`PART4` (47 prompts: 43 active + 4 trashed, 12 favorites, 12 categories, 32 variable sets, 84 variable values, 18 versions). `seed_demo_prompts()` in `db.rs` gates on the `app_meta.demo_seed_version` key vs `DEMO_SEED_VERSION` (currently **2**): if stored ≥ constant it skips; otherwise it wipes prompt rows (and `sqlite_sequence`) and reseeds, then records the new version. **To change demo data:** edit a `partN.rs`, then bump `DEMO_SEED_VERSION` — no other wiring needed.

### 11.4 Graphify knowledge graph (optional)

`graphify-out/` contains a knowledge graph (`graph.json`, `GRAPH_REPORT.md`, `graph.html`). Refresh after code changes with:

```bash
graphify update .        # incremental re-extract of changed files (no API cost)
graphify query "…"       # ask questions about the codebase from the graph
```

---

## 12. Testing

Rust integration tests live in `src-tauri/tests/` and run against real SQLite temp DBs via `Database::new_for_path()` + `init_schema()` (no `AppHandle` needed):

```bash
cd src-tauri
cargo test
```

The suite (9 tests, 3 files):

- **`demo_seed.rs`** — seeds the full demo library (asserts 43 active + 4 trashed = 47), verifies variable sets/values/versions were created, checks idempotency (re-running does not duplicate), and validates replacement of pre-existing rows.
- **`variable_sets.rs`** — set creation, active-set switching, per-set values, deletion with active-set promotion.
- **`empty_trash.rs`** — atomic empty-trash behavior and counts.

The frontend has **no test framework configured**; verification is `npm run build` (tsc strict type-check + Vite build).

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Dev server fails to start | Port 1420 is already in use (`strictPort: true`) | Kill the process on 1420 or change `server.port` in `vite.config.ts` |
| "Failed to load prompts" / empty list | No active vault (DB path unresolved) | Complete vault setup (create/open a folder) — `Database::new` errors with "no active vault selected" |
| Prompt creation fails with a disk I/O error on old DBs | Legacy FTS5 triggers (`prompts_fts`) | Fixed automatically: `init()` drops the FTS5 table + triggers on startup; delete/rename the stale DB if it persists |
| "table prompts has no column named category" on old DBs | Pre-category schema (`collection` column) | Fixed automatically: `init()` renames `collection → category` |
| Settings not applied | Corrupt `localStorage` blob | Clear `prompt-manager-settings` from webview storage; loadSettings falls back to defaults |
| Copy does nothing | Missing clipboard capability | Add `clipboard-manager:allow-write-text` to `src-tauri/capabilities/default.json` (already present) |
| Right-click shows Reload/Inspect Element in production | Native webview context menu | By design: suppressed in production (`main.tsx`) except inside text-editable fields |
| "folder is not empty and is not a vault" on create | Picked a folder with existing content | Choose an empty folder, or use **Open** on a real vault folder |
| "vault folder is missing" on switch | Vault was moved/deleted | Re-open the folder (or its new location) via Open; `exists` flag is recomputed at read time |
| Vault marker rejected | Missing `.promptmanager/vault.json` | Any folder without the marker is "not a vault folder" — create a vault there instead |
| Demo prompts don't appear after editing demo data | `demo_seed_version` already ≥ constant | Bump `DEMO_SEED_VERSION` in `db.rs` so the next launch wipes and reseeds |
| Trash not purging | Retention config | Check Settings → trash timeout/unit; purge runs on app startup |

---

## 14. Roadmap / Limitations

*These are inferred from the current codebase, not a published plan.*

- **FTS5 full-text search was removed.** An earlier FTS5 experiment (`prompts_fts` + triggers) was dropped in favor of `LIKE`-based title search after the triggers caused write failures; search is currently title-only and not full-text.
- **Foreign keys are not enforced** (`PRAGMA foreign_keys` off); related-row cleanup is done explicitly in delete paths — a future refactor could enable FK enforcement.
- **Search scope.** `search_prompts` matches titles only (`LIKE %q%`), not content/tags; content/stats approximations (tokens ≈ length/4 or words×1.33) are intentionally rough.
- **Agents & skills are placeholder modules** — tables and count commands exist, but there are no CRUD commands or full management UI for them yet.
- **No frontend test framework** is configured; only Rust integration tests exist.
- **Single-window, single active vault** — one vault is active at a time (switching reloads the app), and there is no multi-window support.

---

## 15. License

No license file present.
