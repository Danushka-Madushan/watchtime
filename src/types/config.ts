export interface AppConfig {
  omdb: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  details?: string;
  github?: {
    ok: boolean;
    repo: string;
    canPush: boolean;
    error?: string;
  };
  omdb?: {
    ok: boolean;
    error?: string;
  };
}

export const DEFAULT_CONFIG: Readonly<AppConfig> = Object.freeze({
  omdb: '',
  token: '',
  owner: '',
  repo: '',
  branch: '',
});
