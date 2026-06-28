import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useProfileIcon(profileId: string | null) {
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      setIcon(null);
      return;
    }

    invoke<string | null>("get_profile_icon", { id: profileId })
      .then((data) => setIcon(data))
      .catch(() => setIcon(null));
  }, [profileId]);

  return icon;
}

export function useProfileIcons(profileIds: string[]) {
  const [icons, setIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadIcons = async () => {
      const results: Record<string, string> = {};
      for (const id of profileIds) {
        try {
          const data = await invoke<string | null>("get_profile_icon", { id });
          if (data) results[id] = data;
        } catch {
          // ignore
        }
      }
      setIcons(results);
    };
    loadIcons();
  }, [profileIds.join(",")]);

  return icons;
}
