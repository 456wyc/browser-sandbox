import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Group } from "../types";
import { useI18n } from "../i18n/useI18n";

interface GroupModalProps {
  group: Group | null;
  onClose: () => void;
}

export default function GroupModal({ group, onClose }: GroupModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setColor(group.color);
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (group) {
        await invoke("update_group", { id: group.id, name, color });
      } else {
        await invoke("create_group", { name, color });
      }
      onClose();
    } catch (e) {
      console.error("Failed to save group:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-80 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">
          {group ? t.group.editGroup : t.group.newGroup}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.group.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Project Name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.group.color}</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {t.group.cancel}
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              {group ? t.group.save : t.group.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
