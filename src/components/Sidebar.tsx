import type { Group } from "../types";
import { useI18n } from "../i18n/useI18n";

interface SidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onCreateGroup: () => void;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
  onShowSettings: () => void;
}

export default function Sidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onShowSettings,
}: SidebarProps) {
  const { t, locale, toggleLocale } = useI18n();

  return (
    <aside className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-lg font-bold">{t.app.title}</h1>
        <button
          onClick={toggleLocale}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
          title={locale === "zh" ? "Switch to English" : "切换到中文"}
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => onSelectGroup(null)}
          className={`w-full text-left px-3 py-2 rounded transition-colors ${
            selectedGroupId === null
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          {t.sidebar.allProfiles}
        </button>

        <div className="pt-2 pb-1 px-3 flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase">{t.sidebar.groups}</span>
          <button
            onClick={onCreateGroup}
            className="text-gray-400 hover:text-white text-sm"
          >
            +
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.id} className="flex items-center group">
            <button
              onClick={() => onSelectGroup(group.id)}
              className={`flex-1 text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                selectedGroupId === group.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </button>
            <button
              onClick={() => onEditGroup(group)}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white px-1 text-xs"
            >
              {t.profile.edit}
            </button>
            <button
              onClick={() => onDeleteGroup(group.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 px-1 text-xs"
            >
              Del
            </button>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={onShowSettings}
          className="w-full text-left px-3 py-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          {t.sidebar.settings}
        </button>
      </div>
    </aside>
  );
}
