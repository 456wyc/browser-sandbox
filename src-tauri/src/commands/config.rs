use crate::models::{AppConfig, SessionSnapshot};
use crate::storage;
use chrono::Utc;
use std::fs;

#[tauri::command]
pub fn get_config() -> Result<AppConfig, String> {
    Ok(storage::load_config())
}

#[tauri::command]
pub fn save_session(open_profile_ids: Vec<String>) -> Result<(), String> {
    let mut config = storage::load_config();
    config.last_session = Some(SessionSnapshot {
        open_profiles: open_profile_ids,
        timestamp: Utc::now().to_rfc3339(),
    });
    storage::save_config(&config)
}

#[tauri::command]
pub fn get_last_session() -> Result<Option<SessionSnapshot>, String> {
    let config = storage::load_config();
    Ok(config.last_session)
}

#[tauri::command]
pub fn update_browser_paths(chrome_path: Option<String>, edge_path: Option<String>) -> Result<(), String> {
    let mut config = storage::load_config();
    config.chrome_path = chrome_path;
    config.edge_path = edge_path;
    storage::save_config(&config)
}

#[tauri::command]
pub fn export_config(path: String) -> Result<(), String> {
    let config = storage::load_config();
    let data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_config(path: String) -> Result<AppConfig, String> {
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let imported: AppConfig = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    let mut config = storage::load_config();

    // Merge profiles (skip duplicates by id)
    for profile in imported.profiles {
        if !config.profiles.iter().any(|p| p.id == profile.id) {
            config.profiles.push(profile);
        }
    }

    // Merge groups (skip duplicates by id)
    for group in imported.groups {
        if !config.groups.iter().any(|g| g.id == group.id) {
            config.groups.push(group);
        }
    }

    storage::save_config(&config)?;
    Ok(config)
}

#[tauri::command]
pub fn get_profiles_dir() -> Result<String, String> {
    Ok(storage::get_profiles_dir().to_string_lossy().to_string())
}
