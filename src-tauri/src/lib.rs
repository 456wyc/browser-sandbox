mod browser;
mod commands;
mod icon;
mod models;
mod storage;

use commands::{config, group, profile};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            profile::get_profiles,
            profile::create_profile,
            profile::update_profile,
            profile::delete_profile,
            profile::launch_profile,
            profile::get_profile_icon,
            profile::auto_detect_browsers,
            group::get_groups,
            group::create_group,
            group::update_group,
            group::delete_group,
            config::get_config,
            config::save_session,
            config::get_last_session,
            config::update_browser_paths,
            config::export_config,
            config::import_config,
            config::get_profiles_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
