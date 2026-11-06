import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  RefreshCw,
  Sun,
  Moon,
  Settings,
  CloudOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MoviesContext } from '../../context/MoviesContext';
import { ConfigContext } from '../../context/ConfigContext';
import { loadTheme, saveTheme } from '../../services/storageService';

export interface HeaderProps {
  onOpenSettings: () => void;
  title?: string;
  versionBadge?: string;
}

/**
 * Format relative timestamp for last synced display
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SyncIndicator(): React.ReactElement {
  const moviesContext = useContext(MoviesContext);
  const configContext = useContext(ConfigContext);

  const isSyncing = moviesContext?.isSyncing ?? false;
  const syncError = moviesContext?.syncError ?? null;
  const lastSynced = moviesContext?.lastSynced ?? null;
  const syncWithGitHub = moviesContext?.syncWithGitHub;
  const movies = moviesContext?.movies ?? [];
  const hasGitHub = configContext?.hasGitHub ?? false;

  const [relativeTime, setRelativeTime] = useState<string>(() => formatRelativeTime(lastSynced));

  // Periodic update of relative timestamp display
  useEffect(() => {
    setRelativeTime(formatRelativeTime(lastSynced));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSynced));
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  const handleSyncClick = useCallback((): void => {
    if (!isSyncing && hasGitHub && syncWithGitHub) {
      void syncWithGitHub();
    }
  }, [isSyncing, hasGitHub, syncWithGitHub]);

  if (!hasGitHub) {
    return (
      <div
        data-slot="sync-indicator"
        className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas border border-line text-muted"
        title="Local storage mode. Add GitHub credentials in Settings to sync across devices."
      >
        <CloudOff className="w-3.5 h-3.5 text-muted/70" aria-hidden="true" />
        <span>Local Mode ({movies.length})</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        data-slot="sync-indicator"
        className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 border border-accent/20 text-accent animate-pulse"
        title="Synchronizing watchlist with GitHub repository..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <button
        type="button"
        onClick={handleSyncClick}
        data-slot="sync-indicator"
        className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors cursor-pointer"
        title={`Sync error: ${syncError}. Click to retry.`}
        aria-label="Sync failed. Click to retry."
      >
        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Sync Failed (Retry)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSyncClick}
      data-slot="sync-indicator"
      className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors cursor-pointer"
      title={`Last synced: ${lastSynced ? lastSynced.toLocaleString() : 'Never'}. Click to sync now.`}
      aria-label="Synchronize with GitHub repository"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-ok" aria-hidden="true" />
      <span>Synced {relativeTime}</span>
    </button>
  );
}

export function ThemeToggle(): React.ReactElement {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = loadTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    }
    return 'dark';
  });

  // Apply theme to documentElement
  const applyTheme = useCallback((targetTheme: 'light' | 'dark'): void => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback((): void => {
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveTheme(nextTheme);
    applyTheme(nextTheme);
  }, [theme, applyTheme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-slot="theme-toggle"
      className="p-2 rounded-lg text-muted hover:text-ink hover:bg-canvas border border-transparent hover:border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-accent transition-transform duration-200 rotate-0 hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-muted hover:text-ink transition-transform duration-200" aria-hidden="true" />
      )}
    </button>
  );
}

export function Header({
  onOpenSettings,
  title = 'WatchTime',
  versionBadge = 'M3',
}: HeaderProps): React.ReactElement {
  return (
    <header
      data-slot="header"
      className="sticky top-0 z-30 w-full border-b border-line bg-surface/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & App Logo */}
        <div className="flex items-center gap-3">
          <img
            src="./favicon.svg"
            alt="WatchTime Logo"
            className="w-9 h-9 rounded-xl shadow-none transition-transform hover:scale-105 object-contain select-none"
          />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl tracking-tight text-ink flex items-center gap-2">
              <span>{title}</span>
              {versionBadge && (
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-ink">
                  {versionBadge}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Sync Status, Theme Toggle, Settings Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SyncIndicator />
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenSettings}
            data-slot="settings-trigger"
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-canvas border border-transparent hover:border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            aria-label="Open settings"
            title="Open settings"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
