use crate::models::{BrowserType, Profile};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

fn read_u16(data: &[u8], offset: usize) -> u16 {
    u16::from_le_bytes([data[offset], data[offset + 1]])
}

fn read_u32(data: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]])
}

pub fn ensure_profile_icon(profile: &Profile, _profile_index: usize) -> Result<PathBuf, String> {
    let data_dir = PathBuf::from(&profile.data_dir);
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let icon_path = data_dir.join("sandbox_icon.png");

    if profile.badge.is_some() || !icon_path.exists() {
        generate_badged_icon(profile, &icon_path)?;
    }

    Ok(icon_path)
}

fn generate_badged_icon(profile: &Profile, output_path: &PathBuf) -> Result<(), String> {
    let base_icon = extract_browser_icon(&profile.browser)?;

    let badge = match &profile.badge {
        Some(b) if !b.is_empty() => b.clone(),
        _ => {
            base_icon.save(output_path).map_err(|e| e.to_string())?;
            return Ok(());
        }
    };

    let mut img = base_icon;
    draw_badge_on_icon(&mut img, &badge);
    img.save(output_path).map_err(|e| e.to_string())?;
    Ok(())
}

fn extract_browser_icon(browser: &BrowserType) -> Result<image::RgbaImage, String> {
    let exe_path = match browser {
        BrowserType::Chrome => find_browser_exe(&[
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]),
        BrowserType::Edge => find_browser_exe(&[
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ]),
    };

    match exe_path {
        Some(path) => extract_ico_from_exe(&path).or_else(|_| generate_fallback_icon(browser)),
        None => generate_fallback_icon(browser),
    }
}

fn find_browser_exe(candidates: &[&str]) -> Option<String> {
    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

fn extract_ico_from_exe(exe_path: &str) -> Result<image::RgbaImage, String> {
    let data = fs::read(exe_path).map_err(|e| format!("Failed to read exe: {}", e))?;

    if data.len() < 64 || data[0] != b'M' || data[1] != b'Z' {
        return Err("Not a valid PE file".to_string());
    }

    let pe_offset = read_u32(&data, 60) as usize;
    if pe_offset + 24 >= data.len() || data[pe_offset] != b'P' || data[pe_offset + 1] != b'E' {
        return Err("Invalid PE".to_string());
    }

    let num_sections = read_u16(&data, pe_offset + 6) as usize;
    let optional_header_size = read_u16(&data, pe_offset + 20) as usize;

    if pe_offset + 24 + 100 > data.len() {
        return Err("PE too small".to_string());
    }
    let resource_dir_rva = read_u32(&data, pe_offset + 24 + 96);

    let section_start = pe_offset + 24 + optional_header_size;
    let mut resource_offset = None;

    for i in 0..num_sections {
        let section = section_start + i * 40;
        if section + 40 > data.len() { break; }
        let virtual_addr = read_u32(&data, section + 12);
        let raw_offset = read_u32(&data, section + 20);
        let virtual_size = read_u32(&data, section + 8);

        if virtual_addr <= resource_dir_rva && resource_dir_rva < virtual_addr + virtual_size {
            resource_offset = Some((resource_dir_rva - virtual_addr + raw_offset) as usize);
            break;
        }
    }

    let res_offset = resource_offset.ok_or("Resource directory not found")?;

    if res_offset + 16 > data.len() {
        return Err("Resource directory too small".to_string());
    }

    let num_named = read_u16(&data, res_offset + 12) as usize;
    let num_id = read_u16(&data, res_offset + 14) as usize;

    let mut icon_entry_offset = None;
    for i in 0..num_named + num_id {
        let entry = res_offset + 16 + i * 8;
        if entry + 8 > data.len() { break; }
        let id = read_u32(&data, entry);
        let offset_and_flags = read_u32(&data, entry + 4);

        if i >= num_named && id == 3 {
            let offset = (offset_and_flags & 0x7FFFFFFF) as usize;
            icon_entry_offset = Some(res_offset + offset);
            break;
        }
    }

    let entry_offset = icon_entry_offset.ok_or("Icon resource not found")?;
    if entry_offset + 8 > data.len() {
        return Err("Icon entry too small".to_string());
    }

    let data_or_dir = read_u32(&data, entry_offset + 4);

    if data_or_dir & 0x80000000 != 0 {
        let sub_dir_offset = (data_or_dir & 0x7FFFFFFF) as usize;
        let sub_dir = res_offset + sub_dir_offset;

        if sub_dir + 16 > data.len() {
            return Err("Sub directory too small".to_string());
        }

        let sub_num_named = read_u16(&data, sub_dir + 12) as usize;
        let sub_num_id = read_u16(&data, sub_dir + 14) as usize;

        let mut best_icon_offset = None;
        let mut best_size = 0;

        for i in 0..sub_num_named + sub_num_id {
            let entry = sub_dir + 16 + i * 8;
            if entry + 8 > data.len() { break; }
            let _id = read_u32(&data, entry);
            let offset = read_u32(&data, entry + 4);

            if offset & 0x80000000 == 0 {
                let data_entry = res_offset + (offset & 0x7FFFFFFF) as usize;
                if data_entry + 16 <= data.len() {
                    let size = read_u32(&data, data_entry + 8) as usize;
                    if size > best_size {
                        best_size = size;
                        let rva = read_u32(&data, data_entry);
                        best_icon_offset = Some(rva as usize);
                    }
                }
            }
        }

        match best_icon_offset {
            Some(offset) => parse_ico_data(&data, offset),
            None => Err("No valid icon found".to_string()),
        }
    } else {
        let rva = read_u32(&data, entry_offset) as usize;
        parse_ico_data(&data, rva)
    }
}

fn parse_ico_data(data: &[u8], offset: usize) -> Result<image::RgbaImage, String> {
    if offset + 16 > data.len() {
        return Err("ICO data too small".to_string());
    }

    let width = data[offset] as u32;
    let height = data[offset + 1] as u32;
    let bit_count = read_u16(&data, offset + 6) as u32;
    let image_size = read_u32(&data, offset + 8) as usize;
    let image_offset = read_u32(&data, offset + 12) as usize;

    if offset + image_offset + image_size > data.len() {
        return Err("ICO image data out of bounds".to_string());
    }

    let img_data = &data[offset + image_offset..offset + image_offset + image_size];

    let w = if width == 0 { 256 } else { width };
    let h = if height == 0 { 256 } else { height };

    let mut img = image::RgbaImage::new(w, h);

    if bit_count == 32 {
        for y in 0..h {
            for x in 0..w {
                let idx = ((y * w + x) * 4) as usize;
                if idx + 3 < img_data.len() {
                    img.put_pixel(x, y, image::Rgba([img_data[idx + 2], img_data[idx + 1], img_data[idx], img_data[idx + 3]]));
                }
            }
        }
    } else if bit_count == 24 {
        for y in 0..h {
            for x in 0..w {
                let idx = ((y * w + x) * 3) as usize;
                if idx + 2 < img_data.len() {
                    img.put_pixel(x, y, image::Rgba([img_data[idx + 2], img_data[idx + 1], img_data[idx], 255]));
                }
            }
        }
    } else {
        return Err(format!("Unsupported bit count: {}", bit_count));
    }

    Ok(img)
}

fn generate_fallback_icon(browser: &BrowserType) -> Result<image::RgbaImage, String> {
    let size = 256u32;
    let mut img = image::RgbaImage::new(size, size);
    let cx = size as f64 / 2.0;
    let cy = size as f64 / 2.0;
    let r = size as f64 / 2.0 - 4.0;

    match browser {
        BrowserType::Chrome => {
            let colors = [(234u8, 67u8, 53u8), (251u8, 188u8, 5u8), (52u8, 168u8, 83u8)];
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy; let dist = (dx*dx+dy*dy).sqrt();
                if dist > r || dist < r * 0.4 { continue; }
                let angle = dy.atan2(dx); let deg = angle.to_degrees();
                let adjusted = if deg < -30.0 { deg + 360.0 } else { deg };
                let ci = if adjusted < 90.0 { 0 } else if adjusted < 210.0 { 1 } else { 2 };
                let (cr, cg, cb) = colors[ci];
                let a = if dist > r-2.0 { ((r-dist)*127.0) as u8 } else if dist < r*0.42 { 0 } else { 255 };
                if a > 0 { img.put_pixel(x, y, image::Rgba([cr, cg, cb, a])); }
            }}
            let cr = r * 0.42;
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy;
                if (dx*dx+dy*dy).sqrt() <= cr { img.put_pixel(x, y, image::Rgba([255,255,255,255])); }
            }}
            let ir = r * 0.28;
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy;
                if (dx*dx+dy*dy).sqrt() <= ir { img.put_pixel(x, y, image::Rgba([66,133,244,255])); }
            }}
        }
        BrowserType::Edge => {
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy; let dist = (dx*dx+dy*dy).sqrt();
                if dist <= r { let a = if dist > r-2.0 { ((r-dist)*127.0) as u8 } else { 255 }; img.put_pixel(x, y, image::Rgba([0,120,212,a])); }
            }}
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy;
                if (dx*dx+dy*dy).sqrt() <= r*0.85 { let w = (dx*0.03+dy*0.02).sin()*15.0; if dy+w > 0.0 { img.put_pixel(x, y, image::Rgba([107,185,73,255])); } }
            }}
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy;
                if (dx*dx+dy*dy).sqrt() <= r*0.6 { let w = (dx*0.04+dy*0.03).sin()*10.0; if dy+w > 5.0 { img.put_pixel(x, y, image::Rgba([255,255,255,255])); } }
            }}
            let cr = r * 0.25;
            for y in 0..size { for x in 0..size {
                let dx = x as f64 - cx; let dy = y as f64 - cy;
                if (dx*dx+dy*dy).sqrt() <= cr { img.put_pixel(x, y, image::Rgba([0,120,212,255])); }
            }}
        }
    }
    Ok(img)
}

fn draw_badge_on_icon(img: &mut image::RgbaImage, badge: &str) {
    let size = img.width().min(img.height());
    let badge_h = (size as f64 * 0.28) as u32;
    let padding = (size as f64 * 0.04) as u32;
    let badge_y = size - badge_h - padding;
    let badge_x = padding;
    let badge_w = size - padding * 2;

    for y in badge_y..size {
        for x in badge_x..badge_x + badge_w {
            if x < img.width() && y < img.height() {
                let pixel = img.get_pixel(x, y);
                let r = (pixel[0] as f64 * 0.3) as u8;
                let g = (pixel[1] as f64 * 0.3) as u8;
                let b = (pixel[2] as f64 * 0.3) as u8;
                img.put_pixel(x, y, image::Rgba([r, g, b, 200]));
            }
        }
    }

    let text = badge.chars().take(4).collect::<String>();
    let char_count = text.len() as f64;
    let font_size = if char_count <= 1.0 { badge_h as f64 * 0.7 }
        else if char_count <= 2.0 { badge_h as f64 * 0.6 }
        else if char_count <= 3.0 { badge_h as f64 * 0.45 }
        else { badge_h as f64 * 0.35 };

    let text_width = char_count * font_size * 0.6;
    let text_x = (size as f64 - text_width) / 2.0;
    let text_y = badge_y as f64 + (badge_h as f64 - font_size) / 2.0;

    draw_badge_text(img, &text, text_x as i32, text_y as i32, font_size);
}

fn draw_badge_text(img: &mut image::RgbaImage, text: &str, x: i32, y: i32, scale: f64) {
    let glyphs: [&[u8]; 10] = [
        &[0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
        &[0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
        &[0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
        &[0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
        &[0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
        &[0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
        &[0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
        &[0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
        &[0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
        &[0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
    ];

    let chars: Vec<char> = text.chars().collect();
    let mut offset_x = 0;

    for ch in &chars {
        let idx = match ch {
            '0'..='9' => (*ch as usize) - ('0' as usize),
            'A'..='Z' => { let i = (*ch as usize) - ('A' as usize); if i < 10 { i + 10 } else { continue; } }
            'a'..='z' => { let i = (*ch as usize) - ('a' as usize); if i < 10 { i + 10 } else { continue; } }
            _ => {
                let block_size = (scale * 0.8) as i32;
                for by in 0..block_size { for bx in 0..block_size {
                    let px = x + offset_x + bx; let py = y + (scale * 0.1) as i32 + by;
                    if px >= 0 && py >= 0 && (px as u32) < img.width() && (py as u32) < img.height() {
                        img.put_pixel(px as u32, py as u32, image::Rgba([255, 255, 255, 255]));
                    }
                }}
                offset_x += block_size + (scale * 0.1) as i32;
                continue;
            }
        };
        if idx >= 10 { continue; }
        let glyph = &glyphs[idx];
        for (row_idx, &row_bits) in glyph.iter().enumerate() {
            for col in 0..5 {
                if row_bits & (1 << (4 - col)) != 0 {
                    let px = x + offset_x + (col as f64 * scale / 5.0) as i32;
                    let py = y + (row_idx as f64 * scale / 7.0) as i32;
                    let bw = (scale / 5.0).ceil() as i32;
                    let bh = (scale / 7.0).ceil() as i32;
                    for by in 0..bh { for bx in 0..bw {
                        let dx = px + bx; let dy = py + by;
                        if dx >= 0 && dy >= 0 && (dx as u32) < img.width() && (dy as u32) < img.height() {
                            img.put_pixel(dx as u32, dy as u32, image::Rgba([255, 255, 255, 255]));
                        }
                    }}
                }
            }
        }
        offset_x += (scale * 0.6) as i32;
    }
}

pub fn build_browser_args(profile: &Profile) -> Vec<String> {
    let mut args = vec![
        format!("--user-data-dir={}", profile.data_dir),
        "--profile-directory=Default".to_string(),
    ];
    if let Some(ref proxy) = profile.proxy {
        args.push(format!("--proxy-server={}", proxy.server));
    }
    if let Some(ref url) = profile.default_url {
        if !url.is_empty() { args.push(url.clone()); }
    }
    args
}

#[cfg(target_os = "windows")]
pub fn set_window_icon_for_profile(
    browser_path: &str,
    profile: &Profile,
    _profile_index: usize,
    icon_path: &PathBuf,
) -> Result<u32, String> {
    use std::ffi::c_void;

    extern "system" {
        fn FindWindowW(lpclassname: *const u16, lpwindowname: *const u16) -> *mut c_void;
        fn SendMessageW(hwnd: *mut c_void, msg: u32, wparam: usize, lparam: isize) -> isize;
        fn GetWindowThreadProcessId(hwnd: *mut c_void, lpdwprocessid: *mut u32) -> u32;
        fn LoadImageW(hinst: *mut c_void, name: *const u16, typ: u32, cx: i32, cy: i32, fuload: u32) -> *mut c_void;
    }

    const IMAGE_ICON: u32 = 1;
    const LR_LOADFROMFILE: u32 = 0x00000010;
    const WM_SETICON: u32 = 0x0080;
    const ICON_SMALL: usize = 0;
    const ICON_BIG: usize = 1;

    let args = build_browser_args(profile);

    let child = std::process::Command::new(browser_path)
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to launch browser: {}", e))?;

    let child_pid = child.id();
    std::thread::sleep(Duration::from_millis(1200));

    let icon_path_str = icon_path.to_string_lossy().to_string();
    let icon_path_wide: Vec<u16> = icon_path_str.encode_utf16().chain(std::iter::once(0)).collect();

    unsafe {
        let hicon = LoadImageW(std::ptr::null_mut(), icon_path_wide.as_ptr(), IMAGE_ICON, 256, 256, LR_LOADFROMFILE);
        if !hicon.is_null() {
            let class_names: Vec<Vec<u16>> = vec![
                "Chrome_WidgetWin_1".encode_utf16().chain(std::iter::once(0)).collect(),
                "Chrome_WidgetWin_0".encode_utf16().chain(std::iter::once(0)).collect(),
            ];
            for class_name_wide in &class_names {
                let hwnd = FindWindowW(class_name_wide.as_ptr(), std::ptr::null());
                if !hwnd.is_null() {
                    let mut pid = 0u32;
                    GetWindowThreadProcessId(hwnd, &mut pid);
                    if pid == child_pid {
                        SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hicon as isize);
                        SendMessageW(hwnd, WM_SETICON, ICON_BIG, hicon as isize);
                        break;
                    }
                }
            }
        }
    }

    Ok(child_pid)
}

#[cfg(not(target_os = "windows"))]
pub fn set_window_icon_for_profile(
    browser_path: &str,
    profile: &Profile,
    _profile_index: usize,
    _icon_path: &PathBuf,
) -> Result<u32, String> {
    let args = build_browser_args(profile);
    let child = std::process::Command::new(browser_path)
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to launch browser: {}", e))?;
    Ok(child.id())
}
