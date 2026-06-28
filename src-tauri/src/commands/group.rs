use crate::models::Group;
use crate::storage;
use uuid::Uuid;

#[tauri::command]
pub fn get_groups() -> Result<Vec<Group>, String> {
    let config = storage::load_config();
    Ok(config.groups)
}

#[tauri::command]
pub fn create_group(name: String, color: String) -> Result<Group, String> {
    let mut config = storage::load_config();
    let group = Group {
        id: Uuid::new_v4().to_string(),
        name,
        color,
    };
    config.groups.push(group.clone());
    storage::save_config(&config)?;
    Ok(group)
}

#[tauri::command]
pub fn update_group(id: String, name: Option<String>, color: Option<String>) -> Result<Group, String> {
    let mut config = storage::load_config();
    let group = config
        .groups
        .iter_mut()
        .find(|g| g.id == id)
        .ok_or_else(|| "Group not found".to_string())?;

    if let Some(n) = name {
        group.name = n;
    }
    if let Some(c) = color {
        group.color = c;
    }

    let result = group.clone();
    storage::save_config(&config)?;
    Ok(result)
}

#[tauri::command]
pub fn delete_group(id: String) -> Result<(), String> {
    let mut config = storage::load_config();
    let idx = config
        .groups
        .iter()
        .position(|g| g.id == id)
        .ok_or_else(|| "Group not found".to_string())?;

    config.groups.remove(idx);

    // Unassign profiles from this group
    for profile in &mut config.profiles {
        if profile.group_id.as_deref() == Some(&id) {
            profile.group_id = None;
        }
    }

    storage::save_config(&config)
}
