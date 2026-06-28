import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Profile } from "../types";
import { useI18n } from "../i18n/useI18n";

interface ProxyModalProps {
  profile: Profile;
  onClose: () => void;
}

export default function ProxyModal({ profile, onClose }: ProxyModalProps) {
  const { t } = useI18n();
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (profile.proxy) {
      setServer(profile.proxy.server);
      setUsername(profile.proxy.username ?? "");
      setPassword(profile.proxy.password ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("update_profile", {
        id: profile.id,
        proxyServer: server || null,
        proxyUsername: username || null,
        proxyPassword: password || null,
      });
      onClose();
    } catch (e) {
      console.error("Failed to save proxy:", e);
    }
  };

  const handleClear = async () => {
    try {
      await invoke("update_profile", {
        id: profile.id,
        proxyServer: null,
      });
      onClose();
    } catch (e) {
      console.error("Failed to clear proxy:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
        <h2 className="text-xl font-bold mb-1">{t.proxy.title}</h2>
        <p className="text-sm text-gray-400 mb-4">{profile.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t.proxy.server}
            </label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder={t.proxy.placeholder}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t.proxy.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t.proxy.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              {t.proxy.clearProxy}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                {t.proxy.cancel}
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                {t.proxy.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
