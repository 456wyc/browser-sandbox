use crate::browser;
use crate::icon;
use crate::models::{BrowserType, Profile, ProxyConfig};
use crate::storage;
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub fn get_profiles(group_id: Option<String>) -> Result<Vec<Profile>, String> {
    let config = storage::load_config();
    let profiles = match group_id {
        Some(gid) => config.profiles.into_iter().filter(|p| p.group_id.as_deref() == Some(&gid)).collect(),
        None => config.profiles,
    };
    Ok(profiles)
}

#[tauri::command]
pub fn create_profile(
    name: String,
    browser: BrowserType,
    group_id: Option<String>,
    default_url: Option<String>,
    proxy_server: Option<String>,
    proxy_username: Option<String>,
    proxy_password: Option<String>,
    badge: Option<String>,
) -> Result<Profile, String> {
    let mut config = storage::load_config();
    let id = Uuid::new_v4().to_string();
    let profiles_dir = storage::get_profiles_dir();
    let data_dir = profiles_dir.join(&id);

    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let proxy = proxy_server.map(|server| ProxyConfig {
        server,
        username: proxy_username,
        password: proxy_password,
    });

    let profile = Profile {
        id: id.clone(),
        name,
        browser,
        group_id,
        data_dir: data_dir.to_string_lossy().to_string(),
        proxy,
        default_url,
        badge,
        created_at: Utc::now().to_rfc3339(),
        last_used: None,
    };

    config.profiles.push(profile.clone());
    storage::save_config(&config)?;
    Ok(profile)
}

#[tauri::command]
pub fn update_profile(
    id: String,
    name: Option<String>,
    group_id: Option<Option<String>>,
    default_url: Option<Option<String>>,
    proxy_server: Option<Option<String>>,
    proxy_username: Option<Option<String>>,
    proxy_password: Option<Option<String>>,
    badge: Option<Option<String>>,
) -> Result<Profile, String> {
    let mut config = storage::load_config();
    let profile = config
        .profiles
        .iter_mut()
        .find(|p| p.id == id)
        .ok_or_else(|| "Profile not found".to_string())?;

    if let Some(n) = name {
        profile.name = n;
    }
    if let Some(g) = group_id {
        profile.group_id = g;
    }
    if let Some(u) = default_url {
        profile.default_url = u;
    }
    if let Some(b) = badge {
        profile.badge = b;
    }
    if let Some(server) = proxy_server {
        match server {
            Some(s) => {
                profile.proxy = Some(ProxyConfig {
                    server: s,
                    username: proxy_username.unwrap_or(None),
                    password: proxy_password.unwrap_or(None),
                });
            }
            None => {
                profile.proxy = None;
            }
        }
    }

    // Regenerate icon if badge changed
    if profile.badge.is_some() {
        let icon_path = std::path::PathBuf::from(&profile.data_dir).join("sandbox_icon.png");
        let _ = std::fs::remove_file(&icon_path);
    }

    let result = profile.clone();
    storage::save_config(&config)?;
    Ok(result)
}

#[tauri::command]
pub fn delete_profile(id: String, remove_data: bool) -> Result<(), String> {
    let mut config = storage::load_config();
    let idx = config
        .profiles
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| "Profile not found".to_string())?;

    let profile = config.profiles.remove(idx);

    if remove_data {
        let _ = std::fs::remove_dir_all(&profile.data_dir);
    }

    storage::save_config(&config)
}

#[tauri::command]
pub fn launch_profile(id: String) -> Result<(), String> {
    let config = storage::load_config();
    let profile = config
        .find_profile(&id)
        .ok_or_else(|| "Profile not found".to_string())?;

    let browser_path: String = match profile.browser {
        BrowserType::Chrome => config
            .chrome_path
            .clone()
            .or_else(|| browser::detect_browser_path(&BrowserType::Chrome))
            .ok_or("Chrome not found")?,
        BrowserType::Edge => config
            .edge_path
            .clone()
            .or_else(|| browser::detect_browser_path(&BrowserType::Edge))
            .ok_or("Edge not found")?,
    };

    let profile_index = config
        .profiles
        .iter()
        .position(|p| p.id == id)
        .unwrap_or(0);

    let icon_path = icon::ensure_profile_icon(&profile, profile_index)?;

    let mut config = storage::load_config();
    if let Some(p) = config.profiles.iter_mut().find(|p| p.id == id) {
        p.last_used = Some(Utc::now().to_rfc3339());
        let _ = storage::save_config(&config);
    }

    icon::set_window_icon_for_profile(&browser_path, &profile, profile_index, &icon_path)?;

    Ok(())
}

#[tauri::command]
pub fn get_profile_icon(id: String) -> Result<Option<String>, String> {
    let config = storage::load_config();
    let profile = config
        .find_profile(&id)
        .ok_or_else(|| "Profile not found".to_string())?;

    let profile_index = config
        .profiles
        .iter()
        .position(|p| p.id == id)
        .unwrap_or(0);

    let icon_path = icon::ensure_profile_icon(profile, profile_index)?;

    // Read icon file and return as base64 data URL
    if icon_path.exists() {
        let data = std::fs::read(&icon_path).map_err(|e| e.to_string())?;
        let b64 = base64_encode(&data);
        Ok(Some(format!("data:image/png;base64,{}", b64)))
    } else {
        Ok(None)
    }
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 { result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char); } else { result.push('='); }
        if chunk.len() > 2 { result.push(CHARS[(triple & 0x3F) as usize] as char); } else { result.push('='); }
    }
    result
}

#[tauri::command]
pub fn auto_detect_browsers() -> Result<(Option<String>, Option<String>), String> {
    let chrome = browser::detect_browser_path(&BrowserType::Chrome);
    let edge = browser::detect_browser_path(&BrowserType::Edge);
    Ok((chrome, edge))
}
