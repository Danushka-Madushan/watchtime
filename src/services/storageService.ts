import type { AppConfig, ThemePreference } from '../types';

export const CONFIG_STORAGE_KEY = 'watchlist-cfg';
export const THEME_STORAGE_KEY = 'watchlist-theme';

export interface LocationLike {
  hostname?: string;
  pathname?: string;
}

/**
 * Automatically infers GitHub repository owner and name when hosted on GitHub Pages.
 * Handles both project sites (username.github.io/repo) and apex user sites (username.github.io).
 */
export function guessRepo(loc?: LocationLike): { owner: string; repo: string } {
  const locationObj = loc || (typeof window !== 'undefined' ? window.location : {});
  const hostname = locationObj.hostname || '';
  const pathname = locationObj.pathname || '';

  const match = hostname.match(/^(.+)\.github\.io$/i);
  if (!match) {
    return { owner: '', repo: '' };
  }

  const owner = match[1] ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const repo = segments[0] || hostname;

  return { owner, repo };
}

/**
 * Loads configuration from localStorage with automatic GitHub Pages repository guessing
 * and safe parsing defaults.
 */
export function loadConfig(storage?: Storage): AppConfig {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  const guessed = guessRepo();

  const defaults: AppConfig = {
    omdb: '',
    token: '',
    owner: guessed.owner,
    repo: guessed.repo,
    branch: '',
  };

  if (!store) {
    return defaults;
  }

  try {
    const raw = store.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return defaults;
    }

    const obj = parsed as Record<string, unknown>;

    return {
      omdb: typeof obj.omdb === 'string' ? obj.omdb.trim() : defaults.omdb,
      token: typeof obj.token === 'string' ? obj.token.trim() : defaults.token,
      owner: typeof obj.owner === 'string' && obj.owner.trim() ? obj.owner.trim() : defaults.owner,
      repo: typeof obj.repo === 'string' && obj.repo.trim() ? obj.repo.trim() : defaults.repo,
      branch: typeof obj.branch === 'string' ? obj.branch.trim() : defaults.branch,
    };
  } catch {
    return defaults;
  }
}

/**
 * Persists application configuration to localStorage.
 * Tolerant of QuotaExceededError or disabled local storage.
 */
export function saveConfig(config: AppConfig, storage?: Storage): boolean {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return false;

  try {
    store.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears stored configuration.
 */
export function clearConfig(storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;
  try {
    store.removeItem(CONFIG_STORAGE_KEY);
  } catch {
    // Ignore storage deletion errors
  }
}

/**
 * Loads user theme preference ('light' | 'dark' | 'system').
 */
export function loadTheme(storage?: Storage): ThemePreference {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return 'system';

  try {
    const val = store.getItem(THEME_STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

/**
 * Persists user theme preference.
 */
export function saveTheme(theme: ThemePreference, storage?: Storage): boolean {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return false;

  try {
    store.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
