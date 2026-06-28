export type Locale = "zh" | "en";

export interface Translations {
  app: { title: string };
  sidebar: { allProfiles: string; groups: string; settings: string };
  profile: {
    profiles: string;
    newProfile: string;
    editProfile: string;
    name: string;
    browser: string;
    group: string;
    noGroup: string;
    defaultUrl: string;
    launch: string;
    edit: string;
    proxy: string;
    delete: string;
    noProfiles: string;
    noProfilesHint: string;
    myAccount: string;
    create: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
    badge: string;
    badgePlaceholder: string;
    badgeHint: string;
  };
  group: {
    newGroup: string;
    editGroup: string;
    name: string;
    color: string;
    create: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
  };
  proxy: {
    title: string;
    server: string;
    username: string;
    password: string;
    clearProxy: string;
    save: string;
    cancel: string;
    placeholder: string;
  };
  settings: {
    title: string;
    back: string;
    browserPaths: string;
    chromePath: string;
    edgePath: string;
    autoDetect: string;
    profilesDir: string;
    importExport: string;
    exportConfig: string;
    importConfig: string;
    saveSettings: string;
    settingsSaved: string;
    configExported: string;
    configImported: string;
  };
}

const translations: Record<Locale, Translations> = {
  zh: {
    app: { title: "浏览器沙盒管理器" },
    sidebar: {
      allProfiles: "所有配置",
      groups: "分组",
      settings: "设置",
    },
    profile: {
      profiles: "配置",
      newProfile: "新建配置",
      editProfile: "编辑配置",
      name: "名称",
      browser: "浏览器",
      group: "分组",
      noGroup: "无分组",
      defaultUrl: "默认网址（可选）",
      launch: "启动",
      edit: "编辑",
      proxy: "代理",
      delete: "删除",
      noProfiles: "暂无配置",
      noProfilesHint: "创建第一个配置以开始使用",
      myAccount: "我的账号",
      create: "创建",
      save: "保存",
      cancel: "取消",
      deleteConfirm: "确定要删除这个配置吗？",
      badge: "角标",
      badgePlaceholder: "如: A1, 测试, 1",
      badgeHint: "在浏览器图标上显示的文字，最多4个字符",
    },
    group: {
      newGroup: "新建分组",
      editGroup: "编辑分组",
      name: "名称",
      color: "颜色",
      create: "创建",
      save: "保存",
      cancel: "取消",
      deleteConfirm: "确定要删除这个分组吗？配置将被取消分组。",
    },
    proxy: {
      title: "代理设置",
      server: "代理服务器",
      username: "用户名（可选）",
      password: "密码（可选）",
      clearProxy: "清除代理",
      save: "保存",
      cancel: "取消",
      placeholder: "http://proxy:8080",
    },
    settings: {
      title: "设置",
      back: "返回",
      browserPaths: "浏览器路径",
      chromePath: "Chrome 路径",
      edgePath: "Edge 路径",
      autoDetect: "留空自动检测",
      profilesDir: "配置目录",
      importExport: "导入 / 导出",
      exportConfig: "导出配置",
      importConfig: "导入配置",
      saveSettings: "保存设置",
      settingsSaved: "设置已保存！",
      configExported: "配置已导出！",
      configImported: "配置已导入！",
    },
  },
  en: {
    app: { title: "Browser Sandbox Manager" },
    sidebar: {
      allProfiles: "All Profiles",
      groups: "Groups",
      settings: "Settings",
    },
    profile: {
      profiles: "Profiles",
      newProfile: "New Profile",
      editProfile: "Edit Profile",
      name: "Name",
      browser: "Browser",
      group: "Group",
      noGroup: "No Group",
      defaultUrl: "Default URL (optional)",
      launch: "Launch",
      edit: "Edit",
      proxy: "Proxy",
      delete: "Delete",
      noProfiles: "No profiles yet",
      noProfilesHint: "Create your first profile to get started",
      myAccount: "My Account",
      create: "Create",
      save: "Save",
      cancel: "Cancel",
      deleteConfirm: "Delete this profile?",
      badge: "Badge",
      badgePlaceholder: "e.g. A1, Test, 1",
      badgeHint: "Text shown on browser icon, max 4 characters",
    },
    group: {
      newGroup: "New Group",
      editGroup: "Edit Group",
      name: "Name",
      color: "Color",
      create: "Create",
      save: "Save",
      cancel: "Cancel",
      deleteConfirm: "Delete this group? Profiles will be ungrouped.",
    },
    proxy: {
      title: "Proxy Settings",
      server: "Proxy Server",
      username: "Username (optional)",
      password: "Password (optional)",
      clearProxy: "Clear Proxy",
      save: "Save",
      cancel: "Cancel",
      placeholder: "http://proxy:8080",
    },
    settings: {
      title: "Settings",
      back: "Back",
      browserPaths: "Browser Paths",
      chromePath: "Chrome Path",
      edgePath: "Edge Path",
      autoDetect: "Leave empty for auto-detection",
      profilesDir: "Profiles Directory",
      importExport: "Import / Export",
      exportConfig: "Export Config",
      importConfig: "Import Config",
      saveSettings: "Save Settings",
      settingsSaved: "Settings saved!",
      configExported: "Config exported!",
      configImported: "Config imported!",
    },
  },
};

export { translations };
