import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Key,
  Lock,
  GitBranch,
  FolderGit2,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  RotateCcw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { AppConfig, ConnectionTestResult } from '../../types/config';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../../context/ToastContext';
import { guessRepo } from '../../services/storageService';
import { testConnection } from '../../services/githubService';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps): React.ReactElement | null {
  const { config, saveConfig, resetConfig } = useConfig();
  const { showSuccess, showError, showInfo } = useToast();

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Local form state
  const [omdb, setOmdb] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('');

  // Password mask eye toggles
  const [showOmdb, setShowOmdb] = useState<boolean>(false);
  const [showToken, setShowToken] = useState<boolean>(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Reset feedback
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  // Sync form with current config when dialog opens
  useEffect(() => {
    if (isOpen) {
      setOmdb(config.omdb || '');
      setToken(config.token || '');
      setOwner(config.owner || '');
      setRepo(config.repo || '');
      setBranch(config.branch || '');
      setShowOmdb(false);
      setShowToken(false);
      setIsTesting(false);
      setTestResult(null);
      setAutoDetectNotice(null);
    }
  }, [isOpen, config]);

  // Handle native dialog open / close lifecycle safely
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.open = true;
        }
      }
    } else {
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.open = false;
        }
      }
    }
  }, [isOpen]);

  // Handle light dismiss backdrop click fallback
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>): void => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInContent =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInContent) {
          onClose();
        }
      }
    },
    [onClose]
  );

  // Handle Esc cancel event
  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>): void => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  // Auto-detect repository from GitHub Pages hostname
  const handleAutoDetect = (): void => {
    const guessed = guessRepo();
    if (guessed.owner && guessed.repo) {
      setOwner(guessed.owner);
      setRepo(guessed.repo);
      setAutoDetectNotice(`Detected: ${guessed.owner}/${guessed.repo}`);
    } else {
      setAutoDetectNotice('Not hosted on GitHub Pages; please enter owner and repository manually.');
    }
  };

  // Test connection to GitHub and OMDb
  const handleTestConnection = async (): Promise<void> => {
    setIsTesting(true);
    setTestResult(null);

    const testTarget: AppConfig = {
      omdb: omdb.trim(),
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim(),
    };

    try {
      const result = await testConnection(testTarget);
      setTestResult(result);
      if (result.success) {
        showSuccess('Connection successful!');
      } else {
        showError('Connection test failed. Review details below.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown connection error';
      setTestResult({
        success: false,
        message,
      });
      showError(`Connection test failed: ${message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Save settings handler
  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    const updated: AppConfig = {
      omdb: omdb.trim(),
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim(),
    };

    try {
      saveConfig(updated);
      showSuccess('Settings saved successfully.');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      showError(`Error: ${message}`);
    }
  };

  // Clear credentials handler
  const handleReset = (): void => {
    if (window.confirm('Clear all stored credentials and restore defaults?')) {
      resetConfig();
      showInfo('Configuration cleared.');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 m-auto p-0 bg-transparent backdrop:bg-black/65 backdrop:backdrop-blur-sm z-50 max-w-xl w-[calc(100%-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-line open:flex open:flex-col"
    >
      <div className="bg-surface text-ink flex flex-col w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Settings className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-ink">
                Settings & Credentials
              </h2>
              <p className="text-xs text-muted">
                Credentials are saved only in your browser's local storage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {/* Section 1: OMDb API Key */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-omdb-key" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>OMDb API Key</span>
              </label>
              <a
                href="https://www.omdbapi.com/apikey.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Get a free key</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="relative">
              <input
                id="settings-omdb-key"
                type={showOmdb ? 'text' : 'password'}
                value={omdb}
                onChange={(e) => setOmdb(e.target.value)}
                placeholder="e.g. 1a2b3c4d"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-3.5 pr-10 py-2 rounded-lg bg-canvas border border-line text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowOmdb((v) => !v)}
                aria-label={showOmdb ? 'Hide OMDb API key' : 'Show OMDb API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                {showOmdb ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted">
              Enables searching and fetching movie metadata directly from IMDb via OMDb API.
            </p>
          </section>

          {/* Section 2: GitHub Personal Access Token */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-github-token" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>GitHub Personal Access Token (PAT)</span>
              </label>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Generate PAT</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="relative">
              <input
                id="settings-github-token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_... or github_pat_..."
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-3.5 pr-10 py-2 rounded-lg bg-canvas border border-line text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                aria-label={showToken ? 'Hide GitHub token' : 'Show GitHub token'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted">
              Use a fine-grained token with repository permissions: <strong className="text-ink">Contents: Read and write</strong>.
            </p>
          </section>

          {/* Section 3: Repository & Branch Details */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>GitHub Repository Target</span>
              </span>
              <button
                type="button"
                onClick={handleAutoDetect}
                className="text-[11px] text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>Auto-detect</span>
              </button>
            </div>

            {autoDetectNotice && (
              <p className="text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-md">
                {autoDetectNotice}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="settings-owner" className="block text-[11px] font-medium text-muted">
                  Owner / Username
                </label>
                <input
                  id="settings-owner"
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. octocat"
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-repo" className="block text-[11px] font-medium text-muted">
                  Repository Name
                </label>
                <input
                  id="settings-repo"
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. watchtime"
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="settings-branch" className="block text-[11px] font-medium text-muted flex items-center gap-1">
                <GitBranch className="w-3 h-3" aria-hidden="true" />
                <span>Branch (optional, defaults to repository default)</span>
              </label>
              <input
                id="settings-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              />
            </div>
          </section>

          {/* Section 4: Connection Test & Diagnostics */}
          <div className="p-4 rounded-xl bg-canvas border border-line space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-ink">Connection Diagnostics</h3>
                <p className="text-[11px] text-muted">Verify your API credentials and write permissions.</p>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-line border border-line text-xs font-medium text-ink transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                )}
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  testResult.success
                    ? 'bg-ok/10 border-ok/30 text-ok'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{testResult.message}</span>
                </div>

                {testResult.github && (
                  <div className="text-[11px] text-ink/80 pt-1 border-t border-current/20">
                    <span>GitHub: </span>
                    {testResult.github.ok ? (
                      <span className="text-ok font-medium">
                        Repository accessible {testResult.github.canPush ? '(Write enabled)' : '(Read only!)'}
                      </span>
                    ) : (
                      <span className="text-danger font-medium">{testResult.github.error}</span>
                    )}
                  </div>
                )}

                {testResult.omdb && (
                  <div className="text-[11px] text-ink/80">
                    <span>OMDb: </span>
                    {testResult.omdb.ok ? (
                      <span className="text-ok font-medium">Valid API key</span>
                    ) : (
                      <span className="text-danger font-medium">{testResult.omdb.error}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-line">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-danger transition-colors p-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear configuration</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-accent-ink text-xs font-semibold shadow-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default SettingsModal;
