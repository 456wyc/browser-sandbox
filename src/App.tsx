import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Profile, Group, AppConfig } from "./types";
import { I18nContext, useI18n, useI18nProvider } from "./i18n/useI18n";
import Sidebar from "./components/Sidebar";
import ProfileGrid from "./components/ProfileGrid";
import ProfileModal from "./components/ProfileModal";
import GroupModal from "./components/GroupModal";
import ProxyModal from "./components/ProxyModal";
import SettingsPage from "./components/SettingsPage";

function AppInner() {
  const { t } = useI18n();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyProfile, setProxyProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadConfig = async () => {
    try {
      const cfg = await invoke<AppConfig>("get_config");
      setConfig(cfg);
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const filteredProfiles = config?.profiles.filter(
    (p) => selectedGroupId === null || p.group_id === selectedGroupId
  ) ?? [];

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setShowProfileModal(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setShowProfileModal(true);
  };

  const handleLaunchProfile = async (id: string) => {
    try {
      await invoke("launch_profile", { id });
    } catch (e) {
      console.error("Failed to launch:", e);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm(t.profile.deleteConfirm)) return;
    try {
      await invoke("delete_profile", { id, removeData: false });
      await loadConfig();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleEditProxy = (profile: Profile) => {
    setProxyProfile(profile);
    setShowProxyModal(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm(t.group.deleteConfirm)) return;
    try {
      await invoke("delete_group", { id });
      await loadConfig();
    } catch (e) {
      console.error("Failed to delete group:", e);
    }
  };

  const handleModalClose = () => {
    setShowProfileModal(false);
    setShowGroupModal(false);
    setShowProxyModal(false);
    setEditingProfile(null);
    setEditingGroup(null);
    setProxyProfile(null);
    loadConfig();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        groups={config?.groups ?? []}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={handleCreateGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onShowSettings={() => setShowSettings(true)}
      />
      <main className="flex-1 overflow-auto p-6">
        {showSettings ? (
          <SettingsPage onClose={() => setShowSettings(false)} />
        ) : (
          <ProfileGrid
            profiles={filteredProfiles}
            groups={config?.groups ?? []}
            onCreateProfile={handleCreateProfile}
            onEditProfile={handleEditProfile}
            onLaunchProfile={handleLaunchProfile}
            onDeleteProfile={handleDeleteProfile}
            onEditProxy={handleEditProxy}
          />
        )}
      </main>

      {showProfileModal && (
        <ProfileModal
          profile={editingProfile}
          groups={config?.groups ?? []}
          onClose={handleModalClose}
        />
      )}
      {showGroupModal && (
        <GroupModal group={editingGroup} onClose={handleModalClose} />
      )}
      {showProxyModal && proxyProfile && (
        <ProxyModal profile={proxyProfile} onClose={handleModalClose} />
      )}
    </div>
  );
}

function App() {
  const i18n = useI18nProvider();
  return (
    <I18nContext.Provider value={i18n}>
      <AppInner />
    </I18nContext.Provider>
  );
}

export default App;
