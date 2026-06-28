use crate::models::BrowserType;

pub fn detect_browser_path(browser: &BrowserType) -> Option<String> {
    let candidates = match browser {
        BrowserType::Chrome => vec![
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ],
        BrowserType::Edge => vec![
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            "/usr/bin/microsoft-edge",
            "/usr/bin/microsoft-edge-stable",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ],
    };

    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}
