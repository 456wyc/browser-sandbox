# Browser Sandbox Manager — Implementation Plan

## 1. Project Structure

```
browser-sandbox/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── profile.rs          # Profile CRUD
│       │   ├── launcher.rs         # Browser launch
│       │   ├── session.rs          # Session save/restore
│       │   ├── import_export.rs    # JSON import/export
│       │   └── browser_detect.rs   # Auto-detect paths
│       ├── models/
│       │   ├── mod.rs
│       │   ├── profile.rs          # Profile, ProfileGroup
│       │   └── session.rs          # SessionState
│       └── services/
│           ├── mod.rs
│           ├── storage.rs          # File I/O for profiles.json
│           └── process.rs          # Child process management
├── src/                             # Frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Layout.tsx              # Sidebar + main area
│   │   ├── ProfileList.tsx         # List with search/filter
│   │   ├── ProfileCard.tsx         # Single profile display
│   │   ├── ProfileEditor.tsx       # Create/edit form
│   │   ├── GroupManager.tsx        # Group CRUD
│   │   ├── LaunchPanel.tsx         # Quick launch + URL input
│   │   ├── ImportExportDialog.tsx  # Import/export UI
│   │   └── Settings.tsx            # Default paths, theme
│   ├── hooks/
│   │   ├── useProfiles.ts          # Profile state management
│   │   ├── useGroups.ts
│   │   ├── useLauncher.ts
│   │   └── useSession.ts
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   └── styles/
│       └── global.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 2. Data Model

### Rust (src-tauri/src/models/profile.rs)

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub browser_type: BrowserType,  // Chrome | Edge
    pub group_id: Option<String>,
    pub user_data_dir: String,      // Absolute path to profile dir
    pub proxy: Option<ProxyConfig>,
    pub launch_args: Vec<String>,   // Extra CLI flags
    pub created_at: String,         // ISO 8601
    pub last_launched: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BrowserType {
    Chrome,
    Edge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub server: String,             // e.g. "http://proxy:8080"
    pub username: Option<String>,
    pub password: Option<String>,   // Encrypted at rest
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileGroup {
    pub id: String,
    pub name: String,
    pub color: String,              // Hex color for UI badge
    pub profile_ids: Vec<String>,
}
```

### Session State (src-tauri/src/models/session.rs)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub profile_id: String,
    pub pid: Option<u32>,
    pub launched_at: String,
    pub urls: Vec<String>,          // Tabs open at save time
    pub active: bool,
}
```

### Storage Location

All data persists to `%APPDATA%/BrowserSandbox/`:
```
%APPDATA%/BrowserSandbox/
├── profiles.json                  # All profiles + groups
├── session.json                   # Active sessions
├── profiles/                      # Browser user-data-dirs
│   ├── <profile-id-1>/            # Isolated Chrome/Edge profile
│   ├── <profile-id-2>/
│   └── ...
└── export/                        # Temporary export staging
```

### TypeScript Types (src/types/index.ts)

```typescript
export type BrowserType = "Chrome" | "Edge";

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface Profile {
  id: string;
  name: string;
  browserType: BrowserType;
  groupId?: string;
  userDataDir: string;
  proxy?: ProxyConfig;
  launchArgs: string[];
  createdAt: string;
  lastLaunched?: string;
}

export interface ProfileGroup {
  id: string;
  name: string;
  color: string;
  profileIds: string[];
}

export interface SessionState {
  profileId: string;
  pid?: number;
  launchedAt: string;
  urls: string[];
  active: boolean;
}
```

## 3. Rust Backend — Tauri Commands

### src-tauri/src/commands/profile.rs

| Command | Signature | Purpose |
|---------|-----------|---------|
| `create_profile` | `(name, browser_type, group_id?, proxy?, launch_args?) -> Profile` | Creates profile dir under `%APPDATA%/BrowserSandbox/profiles/<uuid>/`, saves to profiles.json |
| `list_profiles` | `() -> Vec<Profile>` | Returns all profiles |
| `get_profile` | `(id) -> Profile` | Single profile lookup |
| `update_profile` | `(id, PatchProfile) -> Profile` | Partial update (name, proxy, args, group) |
| `delete_profile` | `(id) -> bool` | Removes profile dir + entry from profiles.json |
| `create_group` | `(name, color) -> ProfileGroup` | New group |
| `list_groups` | `() -> Vec<ProfileGroup>` | All groups |
| `delete_group` | `(id) -> bool` | Remove group, unassign profiles |
| `reorder_profiles` | `(Vec<String>) -> ()` | Save display order |

### src-tauri/src/commands/launcher.rs

| Command | Signature | Purpose |
|---------|-----------|---------|
| `launch_browser` | `(profile_id, url?) -> SessionState` | Spawns `chrome.exe` or `msedge.exe` with `--user-data-dir=<path>` and optional `--proxy-server=<url>`. Records PID in session.json |
| `detect_browsers` | `() -> BrowserPaths` | Scans common install paths, returns found exe paths |
| `close_browser` | `(profile_id) -> bool` | Kills child process by PID |

### src-tauri/src/commands/session.rs

| Command | Signature | Purpose |
|---------|-----------|---------|
| `save_session` | `() -> Vec<SessionState>` | Snapshot currently running sessions |
| `restore_session` | `(session_ids?) -> Vec<SessionState>` | Relaunch browsers matching saved session state |
| `get_active_sessions` | `() -> Vec<SessionState>` | List running sessions |
| `cleanup_sessions` | `() -> ()` | Remove dead PID entries |

### src-tauri/src/commands/import_export.rs

| Command | Signature | Purpose |
|---------|-----------|---------|
| `export_profiles` | `(profile_ids?, path?) -> String` | Serializes selected/all profiles to JSON file (without user-data-dir contents — just metadata). Returns file path |
| `import_profiles` | `(file_path) -> Vec<Profile>` | Parses JSON, creates new profile dirs, copies any bundled data |
| `export_profile_bundle` | `(profile_id, path) -> String` | Zips the entire `profiles/<id>/` dir + metadata |
| `import_profile_bundle` | `(zip_path) -> Profile` | Extracts zip, registers profile |

### src-tauri/src/commands/browser_detect.rs

Scans these paths on Windows:
```rust
const CHROME_PATHS: &[&str] = &[
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
];
const EDGE_PATHS: &[&str] = &[
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
];
```

Returns `BrowserPaths { chrome: Option<String>, edge: Option<String> }`.

### src-tauri/src/services/process.rs

Manages spawned browser processes:
```rust
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::process::Command;

pub struct ProcessManager {
    processes: Mutex<HashMap<String, u32>>, // profile_id -> PID
}

impl ProcessManager {
    pub fn spawn_browser(
        &self,
        exe_path: &str,
        user_data_dir: &str,
        proxy: Option<&str>,
        extra_args: &[String],
    ) -> Result<u32, String> {
        let mut cmd = Command::new(exe_path);
        cmd.arg(format!("--user-data-dir={}", user_data_dir));
        if let Some(p) = proxy {
            cmd.arg(format!("--proxy-server={}", p));
        }
        // Prevent Chrome "already running" error for same profile
        cmd.arg("--no-first-run");
        for arg in extra_args {
            cmd.arg(arg);
        }
        let child = cmd.spawn().map_err(|e| e.to_string())?;
        let pid = child.id().unwrap_or(0);
        Ok(pid)
    }
}
```

### src-tauri/src/services/storage.rs

Flat-file JSON storage:
```rust
use std::fs;
use std::path::PathBuf;
use directories::BaseDirs;

fn data_dir() -> PathBuf {
    BaseDirs::new().unwrap().data_dir().join("BrowserSandbox")
}

pub fn profiles_path() -> PathBuf { data_dir().join("profiles.json") }
pub fn session_path() -> PathBuf { data_dir().join("session.json") }
pub fn profile_data_dir(id: &str) -> PathBuf { data_dir().join("profiles").join(id) }
```

Read/write with `serde_json` + file locking via `fs2` crate for concurrent safety.

## 4. Frontend UI

### Layout (src/components/Layout.tsx)

```
┌──────────────────────────────────────────────────┐
│  Browser Sandbox Manager              [─][□][×]  │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │  Main Content Area                    │
│          │                                       │
│ [Groups] │  Profile list / Profile editor /      │
│ ├ Work   │  Launch panel / Settings              │
│ ├ Personal│                                      │
│ └ Default│                                       │
│          │                                       │
│ [All]    │                                       │
│          │                                       │
│──────────│                                       │
│ Quick    │                                       │
│ Launch   │                                       │
│          │                                       │
│ [Import] │                                       │
│ [Export] │                                       │
└──────────┴───────────────────────────────────────┘
```

### Component Responsibilities

| Component | State | Renders |
|-----------|-------|---------|
| `ProfileList` | Filtered profiles from `useProfiles` | Scrollable list of `ProfileCard` items, search bar, group filter tabs |
| `ProfileCard` | Single profile | Name, browser icon, proxy badge, group color dot, launch/edit/delete buttons |
| `ProfileEditor` | Form state | Name input, browser type toggle, group dropdown, proxy config (server, user, pass), launch args textarea, save/cancel |
| `LaunchPanel` | URL input | Quick-launch dropdown (all profiles), URL field, Launch button |
| `GroupManager` | Groups list | Color picker, name input, profile count, create/edit/delete |
| `ImportExportDialog` | File selection | Checkboxes for profiles, export format (JSON / Bundle ZIP), file picker for import |
| `Settings` | App config | Default browser paths override, theme (light/dark), auto-cleanup sessions on exit |

### Key UX Flows

**Create Profile:**
1. Click "+" in sidebar or profile list
2. `ProfileEditor` opens with defaults (Chrome, auto-detected path)
3. User fills name, selects group, optionally adds proxy
4. Save → `create_profile` command → `profiles/<uuid>/` dir created → list refreshes

**Launch with URL:**
1. Select profile from list (or use quick-launch)
2. Enter optional URL (e.g. `https://app.example.com`)
3. Click Launch → `launch_browser(profileId, url)` → browser opens isolated

**Session Restore:**
1. App starts → `get_active_sessions` → shows running profiles with green dot
2. Stale sessions (dead PID) shown with gray dot, option to relaunch
3. User clicks "Restore All" → `restore_session()` re-launches all

## 5. Proxy Support Details

The `--proxy-server` flag format:
```
--proxy-server=http://host:port
--proxy-server=socks5://host:port
--proxy-server=http://user:pass@host:port  (basic auth inline)
```

For proxy auth without embedding in URL:
```rust
// When launching, also pass:
cmd.arg(format!("--proxy-server={}", proxy.server));

// If username/password provided, store them in profile's proxy config
// For HTTP proxies, Chrome handles auth via --proxy-server
// For SOCKS5 with auth, use: socks5://user:pass@host:port
```

Proxy validation on save:
```rust
fn validate_proxy(proxy: &ProxyConfig) -> Result<(), String> {
    let url = url::Url::parse(&proxy.server)
        .map_err(|_| "Invalid proxy URL".to_string())?;
    match url.scheme() {
        "http" | "https" | "socks5" => Ok(()),
        _ => Err("Unsupported proxy protocol".to_string()),
    }
}
```

## 6. Session Restore Mechanism

On app startup:
```rust
#[tauri::command]
pub fn restore_stale_sessions(sessions: Vec<SessionState>) -> Vec<SessionState> {
    // Check each PID — if dead, mark active=false
    // User can then click to relaunch
}

#[tauri::command]
pub fn auto_save_session_on_exit() {
    // Save current running sessions to session.json
    // Called via tauri::Builder::on_window_event(WindowEvent::CloseRequested)
}
```

Session JSON structure:
```json
{
  "sessions": [
    {
      "profileId": "abc-123",
      "pid": 5432,
      "launchedAt": "2026-06-28T10:00:00Z",
      "urls": ["https://mail.google.com"],
      "active": true
    }
  ]
}
```

## 7. Import/Export Format

### JSON Export (metadata only)
```json
{
  "version": 1,
  "exportedAt": "2026-06-28T12:00:00Z",
  "profiles": [
    {
      "name": "Work Profile",
      "browserType": "Chrome",
      "proxy": { "server": "http://proxy:8080" },
      "launchArgs": ["--disable-extensions"]
    }
  ],
  "groups": [
    { "name": "Work", "color": "#3B82F6" }
  ]
}
```
User-data-dir contents excluded — fresh dirs created on import.

### Bundle Export (full profile)
ZIP containing:
```
bundle/
├── metadata.json          # Profile config
├── profile-data/          # Compressed user-data-dir
│   ├── Default/
│   ├── Local State
│   └── ...
```

## 8. Step-by-Step Implementation Order

### Phase 1: Scaffold (Days 1–2)

| Step | Files | Description |
|------|-------|-------------|
| 1 | Root | `npm create tauri-app@latest` with React + TypeScript template |
| 2 | `src-tauri/Cargo.toml` | Add deps: `serde`, `serde_json`, `uuid`, `url`, `fs2`, `directories`, `zip` |
| 3 | `src-tauri/tauri.conf.json` | Set window title, dimensions (1000×700), disable CSP for dev |
| 4 | `src-tauri/src/models/profile.rs` | Define all structs and enums |
| 5 | `src-tauri/src/models/session.rs` | Define SessionState |
| 6 | `src-tauri/src/services/storage.rs` | Data dir paths, read/write JSON helpers |

### Phase 2: Backend Core (Days 3–5)

| Step | Files | Description |
|------|-------|-------------|
| 7 | `src-tauri/src/commands/browser_detect.rs` | Implement browser path scanning |
| 8 | `src-tauri/src/commands/profile.rs` | Full CRUD: create, list, get, update, delete |
| 9 | `src-tauri/src/services/process.rs` | ProcessManager with spawn/kill |
| 10 | `src-tauri/src/commands/launcher.rs` | Launch with --user-data-dir + --proxy-server |
| 11 | `src-tauri/src/commands/session.rs` | Session save/restore/cleanup |
| 12 | `src-tauri/src/commands/import_export.rs` | JSON export/import + bundle ZIP |
| 13 | `src-tauri/src/lib.rs` | Register all commands with `tauri::Builder::invoke_handler` |

### Phase 3: Frontend Foundation (Days 6–8)

| Step | Files | Description |
|------|-------|-------------|
| 14 | `src/types/index.ts` | TypeScript interfaces matching Rust models |
| 15 | `src/hooks/useProfiles.ts` | Tauri invoke wrappers for profile CRUD |
| 16 | `src/hooks/useGroups.ts` | Group state management |
| 17 | `src/hooks/useLauncher.ts` | Launch, detect, session hooks |
| 18 | `src/hooks/useSession.ts` | Active session polling |
| 19 | `src/components/Layout.tsx` | Sidebar + main content shell |
| 20 | `src/App.tsx` | Router/state provider setup |

### Phase 4: UI Components (Days 9–12)

| Step | Files | Description |
|------|-------|-------------|
| 21 | `src/components/ProfileList.tsx` | List with search, group filter |
| 22 | `src/components/ProfileCard.tsx` | Card with actions |
| 23 | `src/components/ProfileEditor.tsx` | Full create/edit form |
| 24 | `src/components/LaunchPanel.tsx` | Quick launch + URL input |
| 25 | `src/components/GroupManager.tsx` | Group CRUD with color picker |
| 26 | `src/components/ImportExportDialog.tsx` | File picker, format selection |

### Phase 5: Polish (Days 13–14)

| Step | Files | Description |
|------|-------|-------------|
| 27 | `src/components/Settings.tsx` | Path overrides, theme toggle |
| 28 | `src/styles/global.css` | Dark/light theme, responsive layout |
| 29 | `src-tauri/src/main.rs` | Window close handler for session auto-save |
| 30 | Root | Error handling, loading states, empty states |

### Phase 6: Testing & Packaging (Day 15)

| Step | Action |
|------|--------|
| 31 | Test profile CRUD end-to-end |
| 32 | Test launch with proxy + URL |
| 33 | Test session save/restore after kill + relaunch |
| 34 | Test import/export round-trip |
| 35 | `tauri build` for Windows installer |

## 9. Key Cargo.toml Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
url = "2"
fs2 = "0.4"
directories = "5"
zip = "0.6"
tokio = { version = "1", features = ["process"] }
chrono = { version = "0.4", features = ["serde"] }
```

## 10. Key Design Decisions

1. **Flat-file JSON storage** — No database needed for this scale. profiles.json holds everything; user-data-dirs are filesystem-managed by Chrome/Edge themselves.

2. **PID tracking for sessions** — Use OS process ID to detect if browser is alive. On Windows, check via `OpenProcess` or simply try `kill -0`.

3. **Separate user-data-dir per profile** — Each profile gets its own UUID-named directory. Chrome/Edge treat each as a completely independent browser instance.

4. **Proxy as launch-time flag only** — `--proxy-server` is passed per-launch. Changing proxy on a profile takes effect on next launch; no runtime proxy switching.

5. **Bundle export uses ZIP** — Portable format that includes profile metadata + compressed user-data-dir for full portability.

---

**Files touched**: (none — this is a plan document)
**Findings worth promoting**:
- Chrome/Edge both accept `--user-data-dir=<path>` for full profile isolation
- `--proxy-server` supports http, https, and socks5 schemes with inline auth
- Tauri v2 with React + TypeScript is the recommended stack for this app type
- Session restore works by tracking PID via OS process table and checking liveness on startup
- User data at `%APPDATA%/BrowserSandbox/profiles/<uuid>/` follows Windows conventions
