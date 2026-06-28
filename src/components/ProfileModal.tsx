import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Profile, Group, BrowserType } from "../types";
import { useI18n } from "../i18n/useI18n";

interface ProfileModalProps {
  profile: Profile | null;
  groups: Group[];
  onClose: () => void;
}

export default function ProfileModal({
  profile,
  groups,
  onClose,
}: ProfileModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [browser, setBrowser] = useState<BrowserType>("Chrome");
  const [groupId, setGroupId] = useState<string>("");
  const [defaultUrl, setDefaultUrl] = useState("");
  const [badge, setBadge] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBrowser(profile.browser);
      setGroupId(profile.group_id ?? "");
      setDefaultUrl(profile.default_url ?? "");
      setBadge(profile.badge ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (profile) {
        await invoke("update_profile", {
          id: profile.id,
          name,
          groupId: groupId || null,
          defaultUrl: defaultUrl || null,
          badge: badge || null,
        });
      } else {
        await invoke("create_profile", {
          name,
          browser,
          groupId: groupId || null,
          defaultUrl: defaultUrl || null,
          badge: badge || null,
        });
      }
      onClose();
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">
          {profile ? t.profile.editProfile : t.profile.newProfile}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.profile.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder={t.profile.myAccount}
              required
            />
          </div>

          {!profile && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.profile.browser}</label>
              <select
                value={browser}
                onChange={(e) => setBrowser(e.target.value as BrowserType)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Chrome">Chrome</option>
                <option value="Edge">Edge</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.profile.badge}</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value.slice(0, 4))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder={t.profile.badgePlaceholder}
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">{t.profile.badgeHint}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.profile.group}</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.profile.noGroup}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t.profile.defaultUrl}
            </label>
            <input
              type="url"
              value={defaultUrl}
              onChange={(e) => setDefaultUrl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {t.profile.cancel}
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              {profile ? t.profile.save : t.profile.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
