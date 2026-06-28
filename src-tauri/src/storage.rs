use crate::models::AppConfig;
use std::fs;
use std::path::PathBuf;

pub fn get_config_path() -> PathBuf {
    let app_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("BrowserSandbox");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("config.json")
}

pub fn get_profiles_dir() -> PathBuf {
    let profiles_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("BrowserSandbox")
        .join("profiles");
    fs::create_dir_all(&profiles_dir).ok();
    profiles_dir
}

pub fn load_config() -> AppConfig {
    let path = get_config_path();
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let data = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
