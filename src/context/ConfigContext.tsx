import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AppConfig } from '../types/config';
import {
  loadConfig,
  saveConfig as persistConfig,
  clearConfig,
  guessRepo,
} from '../services/storageService';

export interface ConfigContextValue {
  config: AppConfig;
  isLoading: boolean;
  isSaved: boolean;
  updateConfig: (patch: Partial<AppConfig>) => void;
  saveConfig: (newConfig: AppConfig) => void;
  resetConfig: () => void;
  isConfigured: boolean;
  hasGitHub: boolean;
  hasOmdb: boolean;
  maskSecret: (value: string) => string;
}

const DEFAULT_CONFIG: AppConfig = {
  omdb: '',
  token: '',
  owner: '',
  repo: '',
  branch: '',
};

export const ConfigContext = createContext<ConfigContextValue | null>(null);

export interface ConfigProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AppConfig>;
}

export function ConfigProvider({
  children,
  initialConfig,
}: ConfigProviderProps): React.ReactElement {
  const [config, setConfig] = useState<AppConfig>(() => {
    if (initialConfig) {
      return { ...DEFAULT_CONFIG, ...initialConfig };
    }
    return DEFAULT_CONFIG;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!initialConfig);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Initialize config from localStorage and auto-detect repo on initial mount
  useEffect(() => {
    if (initialConfig) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = loadConfig();
      const guessed = guessRepo();

      const merged: AppConfig = {
        omdb: stored.omdb || '',
        token: stored.token || '',
        owner: stored.owner || guessed.owner || '',
        repo: stored.repo || guessed.repo || '',
        branch: stored.branch || '',
      };

      setConfig(merged);
    } catch (err) {
      console.error('Failed to load initial configuration:', err);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, [initialConfig]);

  // Update in-memory config without committing to localStorage
  const updateConfig = useCallback((patch: Partial<AppConfig>): void => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  // Save config to localStorage and trigger temporary isSaved indicator
  const saveConfig = useCallback((newConfig: AppConfig): void => {
    try {
      persistConfig(newConfig);
      setConfig(newConfig);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to persist configuration:', err);
      throw err;
    }
  }, []);

  // Reset config back to empty defaults
  const resetConfig = useCallback((): void => {
    try {
      clearConfig();
      const guessed = guessRepo();
      setConfig({
        ...DEFAULT_CONFIG,
        owner: guessed.owner || '',
        repo: guessed.repo || '',
      });
      setIsSaved(false);
    } catch (err) {
      console.error('Failed to reset configuration:', err);
    }
  }, []);

  // Safe display masking helper for secrets (PAT & API Key)
  const maskSecret = useCallback((secret: string): string => {
    if (!secret) return '';
    const trimmed = secret.trim();
    if (trimmed.length <= 6) return '•'.repeat(trimmed.length);
    const visiblePrefix = trimmed.slice(0, 4);
    const visibleSuffix = trimmed.slice(-2);
    const bulletCount = Math.max(4, trimmed.length - 6);
    return `${visiblePrefix}${'•'.repeat(bulletCount)}${visibleSuffix}`;
  }, []);

  const hasGitHub = useMemo(
    () => Boolean(config.token.trim() && config.owner.trim() && config.repo.trim()),
    [config.token, config.owner, config.repo]
  );

  const hasOmdb = useMemo(
    () => Boolean(config.omdb.trim()),
    [config.omdb]
  );

  const isConfigured = useMemo(
    () => hasGitHub && hasOmdb,
    [hasGitHub, hasOmdb]
  );

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      isLoading,
      isSaved,
      updateConfig,
      saveConfig,
      resetConfig,
      isConfigured,
      hasGitHub,
      hasOmdb,
      maskSecret,
    }),
    [
      config,
      isLoading,
      isSaved,
      updateConfig,
      saveConfig,
      resetConfig,
      isConfigured,
      hasGitHub,
      hasOmdb,
      maskSecret,
    ]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
