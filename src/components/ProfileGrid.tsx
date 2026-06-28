import type { Profile, Group } from "../types";
import { useI18n } from "../i18n/useI18n";
import ProfileCard from "./ProfileCard";

interface ProfileGridProps {
  profiles: Profile[];
  groups: Group[];
  onCreateProfile: () => void;
  onEditProfile: (profile: Profile) => void;
  onLaunchProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onEditProxy: (profile: Profile) => void;
}

export default function ProfileGrid({
  profiles,
  groups,
  onCreateProfile,
  onEditProfile,
  onLaunchProfile,
  onDeleteProfile,
  onEditProxy,
}: ProfileGridProps) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t.profile.profiles}</h2>
        <button
          onClick={onCreateProfile}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + {t.profile.newProfile}
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">{t.profile.noProfiles}</p>
          <p className="text-sm">{t.profile.noProfilesHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              groups={groups}
              onLaunch={onLaunchProfile}
              onEdit={onEditProfile}
              onDelete={onDeleteProfile}
              onEditProxy={onEditProxy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
