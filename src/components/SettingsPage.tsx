import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../i18n/useI18n";

interface SettingsPageProps {
  onClose: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { t } = useI18n();
  const [chromePath, setChromePath] = useState("");
  const [edgePath, setEdgePath] = useState("");
  const [profilesDir, setProfilesDir] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await invoke<{
        chrome_path: string | null;
        edge_path: string | null;
      }>("get_config");
      setChromePath(config.chrome_path ?? "");
      setEdgePath(config.edge_path ?? "");

      const dir = await invoke<string>("get_profiles_dir");
      setProfilesDir(dir);

      if (!config.chrome_path && !config.edge_path) {
        const detected = await invoke<[string | null, string | null]>(
          "auto_detect_browsers"
        );
        if (detected[0]) setChromePath(detected[0]);
        if (detected[1]) setEdgePath(detected[1]);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const handleSave = async () => {
    try {
      await invoke("update_browser_paths", {
        chromePath: chromePath || null,
        edgePath: edgePath || null,
      });
      alert(t.settings.settingsSaved);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const handleExport = async () => {
    try {
      const path = await save({
        defaultPath: "browser-sandbox-config.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (path) {
        await invoke("export_config", { path });
        alert(t.settings.configExported);
      }
    } catch (e) {
      console.error("Failed to export:", e);
    }
  };

  const handleImport = async () => {
    try {
      const path = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (path) {
        await invoke("import_config", { path });
        alert(t.settings.configImported);
      }
    } catch (e) {
      console.error("Failed to import:", e);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t.settings.title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {t.settings.back}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">{t.settings.browserPaths}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t.settings.chromePath}
              </label>
              <input
                type="text"
                value={chromePath}
                onChange={(e) => setChromePath(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder={t.settings.autoDetect}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t.settings.edgePath}
              </label>
              <input
                type="text"
                value={edgePath}
                onChange={(e) => setEdgePath(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder={t.settings.autoDetect}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">{t.settings.profilesDir}</h3>
          <p className="text-sm text-gray-400">{profilesDir}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">{t.settings.importExport}</h3>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {t.settings.exportConfig}
            </button>
            <button
              onClick={handleImport}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {t.settings.importConfig}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium transition-colors"
        >
          {t.settings.saveSettings}
        </button>
      </div>
    </div>
  );
}
