import type { Profile, Group } from "../types";
import { useI18n } from "../i18n/useI18n";
import { useProfileIcon } from "../hooks/useProfileIcons";

interface ProfileCardProps {
  profile: Profile;
  groups: Group[];
  onLaunch: (id: string) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onEditProxy: (profile: Profile) => void;
}

export default function ProfileCard({
  profile,
  groups,
  onLaunch,
  onEdit,
  onDelete,
  onEditProxy,
}: ProfileCardProps) {
  const { t } = useI18n();
  const icon = useProfileIcon(profile.id);
  const group = groups.find((g) => g.id === profile.group_id);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <img src={icon} alt={profile.browser} className="w-10 h-10 rounded" />
          ) : (
            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
              {profile.badge || profile.browser[0]}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{profile.name}</h3>
            <p className="text-xs text-gray-400">{profile.browser}</p>
            {profile.badge && (
              <p className="text-xs text-blue-400">Badge: {profile.badge}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onLaunch(profile.id)}
          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {t.profile.launch}
        </button>
      </div>

      {group && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          <span className="text-xs text-gray-400">{group.name}</span>
        </div>
      )}

      {profile.default_url && (
        <p className="text-xs text-gray-500 truncate mb-2">
          {profile.default_url}
        </p>
      )}

      {profile.proxy && (
        <p className="text-xs text-yellow-500 mb-2">
          Proxy: {profile.proxy.server}
        </p>
      )}

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={() => onEdit(profile)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {t.profile.edit}
        </button>
        <button
          onClick={() => onEditProxy(profile)}
          className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
        >
          {t.profile.proxy}
        </button>
        <button
          onClick={() => onDelete(profile.id)}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          {t.profile.delete}
        </button>
      </div>
    </div>
  );
}
