# Browser Sandbox Manager（浏览器沙盒管理器）

> 🌐 语言 / Language: **[简体中文](README.zh-CN.md)** · **[English](README.md)**

> 一款轻量级桌面应用，用于并排运行**多个相互隔离的 Chrome / Edge 配置**，非常适合在同一网站上管理多个账号、将工作 / 个人浏览分开，或配合不同代理进行测试。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-built--with-dea584?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-docs-blue?logo=githubpages&logoColor=white)](https://456wyc.github.io/browser-sandbox/)

---

## ✨ 功能特性

- **多浏览器支持** — 自动检测 Windows / macOS / Linux 上的 Chrome 与 Edge。
- **配置完全隔离** — 每个配置以独立的 `--user-data-dir` 启动，Cookie、会话、扩展、历史、书签与设置彼此完全独立。
- **配置管理** — 创建、编辑、删除配置，支持自定义名称、浏览器类型、分组、默认网址与**角标**。
- **自定义角标图标** — 每个配置可生成带文字角标（最多 4 个字符）的专属图标。在 Windows 上，角标会绘制到真实浏览器的任务栏图标上，一眼即可区分不同配置。
- **配置分组** — 按项目或用途组织配置，每个分组拥有独立颜色。
- **代理支持** — 为每个配置单独设置代理（`http` / `https` / `socks5`，可选用户名与密码），启动时通过 `--proxy-server` 传入。
- **会话快照** — 应用会将当前已打开的配置集合记录到 `config.json`，方便后续恢复。
- **导入 / 导出** — 将整套配置（配置 + 分组）导出为 JSON 文件，可在其他机器上导入；按 ID 合并，避免重复。
- **国际化** — 内置中文与英文界面，选择会被本地保存。
- **现代深色界面** — 基于 React + TailwindCSS 打造。

---

## 🖼️ 工作原理

```
 配置 A (Chrome)        配置 B (Edge)         配置 C (Chrome)
 ┌──────────────┐       ┌──────────────┐      ┌──────────────┐
 │ --user-data- │       │ --user-data- │      │ --user-data- │
 │ dir=A/       │       │ dir=B/       │      │ dir=C/       │
 │ --proxy ...  │       │              │      │ [角标图标]   │
 └──────────────┘       └──────────────┘      └──────────────┘
   独立 cookie/          独立 cookie/          独立 cookie/
   会话/扩展             会话/扩展             会话/扩展
```

每个浏览器作为独立进程启动并拥有自己的数据目录，因此配置之间永远不会共享状态。在 Windows 上，启动器甚至会重写窗口的任务栏图标以加入该配置的角标。

---

## 🚀 安装

### 方式 A — 从源码构建

**前置条件**

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [Tauri v2 前置依赖](https://v2.tauri.app/start/prerequisites/)

```bash
# 克隆仓库
git clone https://github.com/456wyc/browser-sandbox.git
cd browser-sandbox

# 安装前端依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产安装包（按当前系统）
npm run tauri build
```

构建产物（安装包 / 可执行文件）位于 `src-tauri/target/release/`（或对应平台的打包目录）下。

### 方式 B — 预编译发布版

待发布后，可直接从仓库的 **Releases** 页面下载最新安装包。

---

## 📖 使用说明

1. 点击 **新建配置**（New Profile）创建一个浏览器配置。
2. 选择**浏览器类型**（Chrome / Edge）。
3. 设置**角标**（如 `A1`、`Work`、`1`）——它会显示在任务栏图标和应用内。
4. 可选：将配置分配到某个**分组**、设置**默认网址**，或配置**代理**。
5. 点击**启动**（Launch）以完全隔离的数据目录打开浏览器。

在**设置**面板中可覆盖浏览器可执行文件路径、查看配置目录，以及导入 / 导出你的配置。

---

## ⚙️ 配置与存储

所有数据均存储在操作系统的配置目录下（无需数据库）：

| 系统 | 路径 |
| ---- | ---- |
| Windows | `%APPDATA%\BrowserSandbox\` |
| macOS | `~/Library/Application Support/BrowserSandbox/` |
| Linux | `~/.config/BrowserSandbox/` |

```
BrowserSandbox/
├── config.json              # 配置、分组、上次会话、浏览器路径
└── profiles/
    ├── <profile-uuid>/      # 隔离的 Chrome/Edge 用户数据目录
    │   ├── sandbox_icon.png # 生成的角标图标（Windows）
    │   └── ...              # Default/、Local State 等
    └── <profile-uuid>/
```

`config.json` 为格式化后的 JSON，也是导入 / 导出所使用的格式。

---

## 🧩 Tauri 命令参考

Rust 后端通过 Tauri 暴露以下命令（前端使用 `invoke` 调用）：

| 命令 | 签名 | 用途 |
| ---- | ---- | ---- |
| `get_config` | `() -> AppConfig` | 加载完整应用配置。 |
| `get_profiles` | `(group_id?) -> Profile[]` | 列出配置，可按分组过滤。 |
| `create_profile` | `(name, browser, group_id?, default_url?, proxy_server?, proxy_username?, proxy_password?, badge?) -> Profile` | 创建配置 + 数据目录。 |
| `update_profile` | `(id, name?, group_id?, default_url?, proxy_server?, proxy_username?, proxy_password?, badge?) -> Profile` | 部分更新配置。 |
| `delete_profile` | `(id, remove_data: bool) -> ()` | 删除配置；可选同时删除数据目录。 |
| `launch_profile` | `(id) -> ()` | 以该配置隔离参数启动浏览器。 |
| `get_profile_icon` | `(id) -> String?` | 返回带角标的 base64 PNG 图标。 |
| `auto_detect_browsers` | `() -> (chrome?, edge?)` | 扫描常见安装路径。 |
| `get_groups` | `() -> Group[]` | 列出所有分组。 |
| `create_group` | `(name, color) -> Group` | 创建分组。 |
| `update_group` | `(id, name?, color?) -> Group` | 更新分组。 |
| `delete_group` | `(id) -> ()` | 删除分组（其下配置将变为未分组）。 |
| `save_session` | `(open_profile_ids: string[]) -> ()` | 快照当前已打开的配置。 |
| `get_last_session` | `() -> SessionSnapshot?` | 读取上次保存的会话。 |
| `update_browser_paths` | `(chrome_path?, edge_path?) -> ()` | 覆盖自动检测的浏览器路径。 |
| `export_config` | `(path) -> ()` | 将 `config.json` 写入文件。 |
| `import_config` | `(path) -> AppConfig` | 将配置文件合并到当前配置。 |
| `get_profiles_dir` | `() -> String` | 返回配置存储目录。 |

---

## 🛠️ 技术栈

- **后端**：[Tauri v2](https://v2.tauri.app/) + Rust
  - 使用 `image` crate 生成角标图标
  - 使用 `serde` / `serde_json` 进行配置（反）序列化
  - 使用 `uuid`、`chrono`、`dirs` 处理 ID、时间戳与平台路径
- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **存储**：操作系统配置目录下的 JSON 配置

---

## 📁 项目结构

```
browser-sandbox/
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs             # 程序入口
│   │   ├── lib.rs              # Tauri 构建器 + 命令注册
│   │   ├── models.rs           # Profile / Group / AppConfig 类型
│   │   ├── storage.rs          # config.json 读写与路径
│   │   ├── browser.rs          # 浏览器路径自动检测
│   │   ├── icon.rs             # 角标图标生成 + Windows 窗口图标
│   │   └── commands/           # Tauri 命令
│   │       ├── profile.rs      # 配置增删改查 + 启动 + 图标
│   │       ├── group.rs        # 分组增删改查
│   │       └── config.rs       # 配置、会话、导入导出、路径
│   ├── tauri.conf.json         # 窗口与打包配置
│   └── icons/
├── src/                        # React 前端
│   ├── main.tsx
│   ├── App.tsx                 # 状态与布局编排
│   ├── components/             # 侧边栏、配置网格/卡片、弹窗、设置
│   ├── hooks/                  # useProfileIcons
│   ├── i18n/                   # 中文 / 英文翻译
│   ├── types/                  # 共享 TypeScript 类型
│   └── styles/                # Tailwind/全局 CSS
├── docs/                       # GitHub Pages 站点（见下文）
└── README.md
```

---

## 🌐 GitHub Pages

静态项目站点（落地页 + 文档）位于 [`docs/`](docs/index.html) 目录，并通过 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) 中的工作流自动部署到 **GitHub Pages**。

- 线上地址：**https://456wyc.github.io/browser-sandbox/**
- 每次推送 `master` 且改动 `docs/**` 时会自动重新部署。
- 本地预览：启动 `docs/` 目录的静态服务，例如 `npx serve docs`。

如需在你的 Fork 中启用：**Settings → Pages → Build and deployment → Source: GitHub Actions**。

---

## 🤝 开发

```bash
npm install            # 前端依赖
npm run dev            # 仅启动 Vite 开发服务器（无 Tauri 窗口）
npm run tauri dev      # 完整桌面应用开发模式
npm run tauri build    # 生产构建
```

在 `src-tauri/` 内可运行 `cargo fmt` / `cargo clippy` 进行 Rust 格式化与检查，运行 `npm run build` 进行带类型检查的前端构建。

---

## 📄 许可证

[MIT](LICENSE) © Browser Sandbox Manager 贡献者。
