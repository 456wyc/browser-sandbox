export type BrowserType = "Chrome" | "Edge";

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface Profile {
  id: string;
  name: string;
  browser: BrowserType;
  group_id: string | null;
  data_dir: string;
  proxy: ProxyConfig | null;
  default_url: string | null;
  badge: string | null;
  created_at: string;
  last_used: string | null;
}

export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface SessionSnapshot {
  open_profiles: string[];
  timestamp: string;
}

export interface AppConfig {
  profiles: Profile[];
  groups: Group[];
  last_session: SessionSnapshot | null;
  chrome_path: string | null;
  edge_path: string | null;
}
