# Browser Sandbox Manager

A desktop application for managing multiple Chrome/Edge browser profiles with isolated data directories. Perfect for testing multiple accounts on the same website simultaneously.

## Features

- **Multi-browser support** — Chrome and Edge with auto-detection
- **Profile management** — Create, edit, delete browser profiles with custom names
- **Custom badge icons** — Each profile gets a unique icon with editable text badge on the real browser icon
- **Profile groups** — Organize profiles by project or purpose
- **Proxy support** — Assign different proxy settings to different profiles
- **Session restore** — Remember and restore open profiles
- **Import/Export** — Share profile configurations
- **i18n** — Chinese and English language support
- **Dark theme** — Modern dark UI with TailwindCSS

## How It Works

Each profile gets its own isolated `--user-data-dir`, providing complete separation of:
- Cookies and sessions
- Extensions
- History and bookmarks
- Settings

## Installation

### Build from Source

Prerequisites:
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
# Clone the repository
git clone https://github.com/your-username/browser-sandbox.git
cd browser-sandbox

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

1. Click **+ New Profile** to create a browser profile
2. Select browser type (Chrome/Edge)
3. Set a **Badge** text to identify the profile (appears on taskbar icon)
4. Optionally assign to a group or set a default URL
5. Click **Launch** to open the browser with isolated data

## Tech Stack

- **Backend**: Tauri v2 + Rust
- **Frontend**: React + TypeScript + TailwindCSS
- **Storage**: JSON config at `%APPDATA%\BrowserSandbox\`

## License

MIT
