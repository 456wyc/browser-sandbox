# Browser Sandbox Manager

> 🌐 语言 / Language: **[English](README.md)** · **[简体中文](README.zh-CN.md)**

> A lightweight desktop app for running **multiple isolated Chrome / Edge profiles** side by side — perfect for managing multiple accounts on the same site, separating work/personal browsing, or testing with different proxies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-built--with-dea584?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-docs-blue?logo=githubpages&logoColor=white)](https://456wyc.github.io/browser-sandbox/)

---

## ✨ Features

- **Multi-browser support** — Chrome and Microsoft Edge with automatic path detection (Windows / macOS / Linux).
- **Isolated profiles** — Every profile launches with its own `--user-data-dir`, giving complete separation of cookies, sessions, extensions, history, bookmarks, and settings.
- **Profile management** — Create, edit, and delete profiles with a custom name, browser type, group, default URL, and a **badge**.
- **Custom badge icons** — Each profile can render a unique icon with an editable text **badge** (up to 4 characters). On Windows the badge is drawn onto the real browser's taskbar icon so you can tell profiles apart at a glance.
- **Profile groups** — Organize profiles by project or purpose, each with its own color.
- **Proxy support** — Assign a per-profile proxy (`http` / `https` / `socks5`, with optional username & password) passed at launch via `--proxy-server`.
- **Session snapshot** — The app remembers the set of currently-open profiles in `config.json` so you can restore them later.
- **Import / Export** — Export the full configuration (profiles + groups) to a JSON file and import it on another machine; profiles are merged by ID to avoid duplicates.
- **Internationalization** — Chinese and English UI; the choice is persisted locally.
- **Modern dark UI** — Built with React + TailwindCSS.

---

## 🖼️ How it works

```
 Profile A (Chrome)      Profile B (Edge)      Profile C (Chrome)
 ┌──────────────┐        ┌──────────────┐      ┌──────────────┐
 │ --user-data- │        │ --user-data- │      │ --user-data- │
 │ dir=A/       │        │ dir=B/       │      │ dir=C/       │
 │ --proxy ...  │        │              │      │ [badge icon] │
 └──────────────┘        └──────────────┘      └──────────────┘
   isolated cookie/        isolated cookie/      isolated cookie/
   session/extension       session/extension     session/extension
```

Each browser is spawned as an independent process with its own data directory, so profiles never share state. On Windows the launcher even rewrites the window's taskbar icon to include the profile's badge.

---

## 🚀 Installation

### Option A — Build from source

**Prerequisites**

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
# Clone the repository
git clone https://github.com/456wyc/browser-sandbox.git
cd browser-sandbox

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build a production installer (per your OS)
npm run tauri build
```

The build output (installer / binary) is placed under `src-tauri/target/release/` (or a platform-specific bundle directory).

### Option B — Prebuilt release

Download the latest installer from the **Releases** page of the repository once published.

---

## 📖 Usage

1. Click **New Profile** (新建配置) to create a browser profile.
2. Choose the **browser type** (Chrome / Edge).
3. Set a **Badge** (e.g. `A1`, `Work`, `1`) — it appears on the taskbar icon and in the app.
4. Optionally assign the profile to a **Group**, set a **default URL**, or configure a **Proxy**.
5. Click **Launch** (启动) to open the browser with a fully isolated data directory.

Use the **Settings** panel to override browser executable paths, view the profiles directory, and import/export your configuration.

---

## ⚙️ Configuration & Storage

All data is stored under the OS config directory (no database required):

| OS      | Path |
| ------- | ---- |
| Windows | `%APPDATA%\BrowserSandbox\` |
| macOS   | `~/Library/Application Support/BrowserSandbox/` |
| Linux   | `~/.config/BrowserSandbox/` |

```
BrowserSandbox/
├── config.json              # Profiles, groups, last session, browser paths
└── profiles/
    ├── <profile-uuid>/      # Isolated Chrome/Edge user-data-dir
    │   ├── sandbox_icon.png # Generated badge icon (Windows)
    │   └── ...              # Default/, Local State, etc.
    └── <profile-uuid>/
```

`config.json` is pretty-printed JSON and the source format used by import/export.

---

## 🧩 Tauri Command Reference

The Rust backend exposes the following Tauri commands (called from the frontend via `invoke`):

| Command | Signature | Purpose |
| ------- | --------- | ------- |
| `get_config` | `() -> AppConfig` | Load the full app configuration. |
| `get_profiles` | `(group_id?) -> Profile[]` | List profiles, optionally filtered by group. |
| `create_profile` | `(name, browser, group_id?, default_url?, proxy_server?, proxy_username?, proxy_password?, badge?) -> Profile` | Create a profile + data dir. |
| `update_profile` | `(id, name?, group_id?, default_url?, proxy_server?, proxy_username?, proxy_password?, badge?) -> Profile` | Partial update of a profile. |
| `delete_profile` | `(id, remove_data: bool) -> ()` | Delete a profile; optionally remove its data dir. |
| `launch_profile` | `(id) -> ()` | Spawn the browser with the profile's isolated args. |
| `get_profile_icon` | `(id) -> String?` | Return a base64 PNG icon (with badge) for the profile. |
| `auto_detect_browsers` | `() -> (chrome?, edge?)` | Scan common install paths. |
| `get_groups` | `() -> Group[]` | List all groups. |
| `create_group` | `(name, color) -> Group` | Create a group. |
| `update_group` | `(id, name?, color?) -> Group` | Update a group. |
| `delete_group` | `(id) -> ()` | Delete a group (profiles become ungrouped). |
| `save_session` | `(open_profile_ids: string[]) -> ()` | Snapshot currently-open profiles. |
| `get_last_session` | `() -> SessionSnapshot?` | Read the last saved session. |
| `update_browser_paths` | `(chrome_path?, edge_path?) -> ()` | Override auto-detected browser paths. |
| `export_config` | `(path) -> ()` | Write `config.json` to a file. |
| `import_config` | `(path) -> AppConfig` | Merge a config file into the current one. |
| `get_profiles_dir` | `() -> String` | Return the profiles storage directory. |

---

## 🛠️ Tech Stack

- **Backend**: [Tauri v2](https://v2.tauri.app/) + Rust
  - `image` crate for badge icon generation
  - `serde` / `serde_json` for config (de)serialization
  - `uuid`, `chrono`, `dirs` for IDs, timestamps, and platform paths
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Storage**: JSON config at the OS config directory

---

## 📁 Project Structure

```
browser-sandbox/
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs             # App entry
│   │   ├── lib.rs              # Tauri builder + command registration
│   │   ├── models.rs           # Profile / Group / AppConfig types
│   │   ├── storage.rs          # config.json read/write + paths
│   │   ├── browser.rs          # Browser path auto-detection
│   │   ├── icon.rs             # Badge icon generation + Windows window icon
│   │   └── commands/           # Tauri commands
│   │       ├── profile.rs      # Profile CRUD + launch + icon
│   │       ├── group.rs        # Group CRUD
│   │       └── config.rs       # Config, session, import/export, paths
│   ├── tauri.conf.json         # Window & bundle config
│   └── icons/
├── src/                        # React frontend
│   ├── main.tsx
│   ├── App.tsx                 # State + layout orchestration
│   ├── components/             # Sidebar, ProfileGrid/Card, modals, Settings
│   ├── hooks/                  # useProfileIcons
│   ├── i18n/                   # zh / en translations
│   ├── types/                  # Shared TypeScript types
│   └── styles/                # Tailwind/global CSS
├── docs/                       # GitHub Pages site (see below)
└── README.md
```

---

## 🌐 GitHub Pages

A static project site (landing page + docs) lives in the [`docs/`](docs/index.html) folder and is automatically deployed to **GitHub Pages** via the workflow in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

- Live site: **https://456wyc.github.io/browser-sandbox/**
- It redeploys automatically on every push to `master` that touches `docs/**`.
- To preview locally: serve the `docs/` directory, e.g. `npx serve docs`.

To enable in your fork: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## 🤝 Development

```bash
npm install            # frontend deps
npm run dev            # Vite dev server only (no Tauri window)
npm run tauri dev      # full desktop app in dev mode
npm run tauri build    # production build
```

Run `cargo fmt` / `cargo clippy` inside `src-tauri/` for Rust lint/format, and `npm run build` for a type-checked frontend build.

---

## 📄 License

[MIT](LICENSE) © Browser Sandbox Manager contributors.
