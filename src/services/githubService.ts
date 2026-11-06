import type { AppConfig, ConnectionTestResult, Movie } from '../types';

export const GITHUB_API_VERSION = '2022-11-28';
export const DATA_FILE_PATH = 'data/movies.json';

/**
 * Standard commit messages format as established in the legacy implementation.
 */
export const COMMIT_MESSAGES = {
  add: (title: string) => `Add ${title}`,
  watched: (title: string) => `Watched ${title}`,
  unwatch: (title: string) => `Unwatch ${title}`,
  remove: (title: string) => `Remove ${title}`,
  updatePoster: (title: string) => `Update poster for ${title}`,
} as const;

/**
 * Concurrency-safe promise chain for sequential commits.
 */
let saveChain: Promise<void> = Promise.resolve();

/**
 * Resets the save chain (primarily for testing purposes).
 */
export function _resetSaveChain(): void {
  saveChain = Promise.resolve();
}

/**
 * Encodes a UTF-8 string into Base64 safely without corrupting multi-byte characters.
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

function getContentsUrl(owner: string, repo: string, branch?: string): string {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${DATA_FILE_PATH}`;
  return branch?.trim() ? `${url}?ref=${encodeURIComponent(branch.trim())}` : url;
}

function getGhHeaders(token: string, extra?: Record<string, string>): HeadersInit {
  return {
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    ...extra,
  };
}

/**
 * Fetches the movies list. If GitHub credentials are configured, loads from the GitHub API.
 * Otherwise, falls back to loading local `data/movies.json`.
 */
export async function fetchMovies(config: AppConfig): Promise<Movie[]> {
  const hasGhConfig = Boolean(config.token?.trim() && config.owner?.trim() && config.repo?.trim());

  if (!hasGhConfig) {
    const localUrl = `${DATA_FILE_PATH}?t=${Date.now()}`;
    const res = await fetch(localUrl, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Could not load local list (${res.status})`);
    }
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as Movie[]) : [];
  }

  const endpoint = getContentsUrl(config.owner, config.repo, config.branch);
  const res = await fetch(endpoint, {
    headers: getGhHeaders(config.token, { Accept: 'application/vnd.github.raw+json' }),
    cache: 'no-store',
  });

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Could not load your list (${res.status})`);
  }

  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as Movie[]) : [];
}

/**
 * Alias for fetchMovies for compatibility.
 */
export async function fetchMoviesFromGitHub(config: AppConfig): Promise<Movie[]> {
  return fetchMovies(config);
}

/**
 * Serialized save queue: chains commits sequentially to prevent SHA conflicts.
 * Even if a previous save fails, subsequent saves will still execute.
 */
export function saveMovies(movies: Movie[], commitMessage: string, config: AppConfig): Promise<void> {
  if (!config.token?.trim() || !config.owner?.trim() || !config.repo?.trim()) {
    return Promise.reject(new Error('Add a GitHub token in settings to save changes.'));
  }

  const task = async (): Promise<void> => {
    const snapshot = JSON.stringify(movies, null, 2) + '\n';
    const contentsUrl = getContentsUrl(config.owner, config.repo, config.branch);

    // 1. Fetch current blob SHA
    let sha: string | undefined;
    const metaRes = await fetch(contentsUrl, {
      headers: getGhHeaders(config.token, { Accept: 'application/vnd.github+json' }),
      cache: 'no-store',
    });

    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { sha: string };
      sha = meta.sha;
    } else if (metaRes.status !== 404) {
      throw new Error(`GitHub error ${metaRes.status}`);
    }

    // 2. Commit updated contents
    const body: { message: string; content: string; sha?: string; branch?: string } = {
      message: commitMessage,
      content: utf8ToBase64(snapshot),
    };

    if (sha) {
      body.sha = sha;
    }
    if (config.branch?.trim()) {
      body.branch = config.branch.trim();
    }

    const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${DATA_FILE_PATH}`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: getGhHeaders(config.token, {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const errJson = (await putRes.json().catch(() => ({}))) as { message?: string };
      throw new Error(errJson.message || `Save failed (${putRes.status})`);
    }
  };

  // Chain sequentially without allowing previous rejection to break subsequent tasks
  const currentTask = saveChain.then(task, task);
  saveChain = currentTask.catch(() => {});
  return currentTask;
}

/**
 * Alias for saveMovies for compatibility.
 */
export function saveMoviesToGitHub(movies: Movie[], commitMessage: string, config: AppConfig): Promise<void> {
  return saveMovies(movies, commitMessage, config);
}

/**
 * Comprehensive connection verification testing both GitHub token & repository
 * permissions (read + write/push) and OMDb API key validity.
 */
export async function testConnection(config: AppConfig): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    success: false,
    message: '',
  };

  const hasGithub = Boolean(config.token?.trim() && config.owner?.trim() && config.repo?.trim());
  if (!hasGithub) {
    result.github = {
      ok: false,
      repo: `${config.owner}/${config.repo}`,
      canPush: false,
      error: 'GitHub credentials incomplete (token, owner, and repo required).',
    };
  } else {
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${config.owner.trim()}/${config.repo.trim()}`, {
        headers: getGhHeaders(config.token, { Accept: 'application/vnd.github+json' }),
      });

      if (repoRes.status === 401) {
        result.github = {
          ok: false,
          repo: `${config.owner}/${config.repo}`,
          canPush: false,
          error: 'Invalid GitHub Personal Access Token (401 Unauthorized).',
        };
      } else if (repoRes.status === 404) {
        result.github = {
          ok: false,
          repo: `${config.owner}/${config.repo}`,
          canPush: false,
          error: `Repository '${config.owner}/${config.repo}' not found or token lacks access.`,
        };
      } else if (!repoRes.ok) {
        result.github = {
          ok: false,
          repo: `${config.owner}/${config.repo}`,
          canPush: false,
          error: `GitHub repository check failed (${repoRes.status}).`,
        };
      } else {
        const repoData = (await repoRes.json()) as {
          full_name?: string;
          permissions?: { push?: boolean; admin?: boolean };
        };
        const canPush = repoData.permissions?.push !== false;
        result.github = {
          ok: true,
          repo: repoData.full_name || `${config.owner}/${config.repo}`,
          canPush,
          error: canPush ? undefined : 'Token has read access, but lacks write/push permissions.',
        };
      }
    } catch (e) {
      result.github = {
        ok: false,
        repo: `${config.owner}/${config.repo}`,
        canPush: false,
        error: e instanceof Error ? e.message : 'Network error checking GitHub.',
      };
    }
  }

  // OMDb API Key Check
  if (config.omdb?.trim()) {
    try {
      const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${config.omdb.trim()}&i=tt0111161`);
      if (!omdbRes.ok) {
        result.omdb = { ok: false, error: `OMDb HTTP error: ${omdbRes.status}` };
      } else {
        const data = (await omdbRes.json()) as { Response?: string; Error?: string };
        if (data.Response === 'False' && /key/i.test(data.Error || '')) {
          result.omdb = { ok: false, error: data.Error || 'Invalid OMDb API key.' };
        } else {
          result.omdb = { ok: true };
        }
      }
    } catch (e) {
      result.omdb = { ok: false, error: e instanceof Error ? e.message : 'Network error checking OMDb.' };
    }
  } else {
    result.omdb = { ok: false, error: 'OMDb API key not provided.' };
  }

  const githubSuccess = Boolean(result.github?.ok && result.github?.canPush);
  const omdbSuccess = Boolean(!config.omdb?.trim() || result.omdb?.ok);

  result.success = githubSuccess && omdbSuccess;
  if (result.success) {
    result.message = 'Connection successful. GitHub repository accessible with write permissions.';
  } else {
    const errors: string[] = [];
    if (result.github?.error) errors.push(result.github.error);
    if (result.omdb?.error && config.omdb?.trim()) errors.push(result.omdb.error);
    result.message = errors.join(' | ') || 'Connection test failed.';
  }

  return result;
}
