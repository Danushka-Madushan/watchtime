import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { Movie, MediaType, ViewFilter, SortOption } from '../types/movie';
import { useConfig } from './ConfigContext';
import { useToast } from './ToastContext';
import { fetchMoviesFromGitHub, saveMoviesToGitHub } from '../services/githubService';
import { fetchMovieById } from '../services/omdbService';
import { sanitizeString, isValidUrl } from '../utils/sanitize';
import fallbackMoviesData from '../../data/movies.json';

export interface MoviesContextValue {
  movies: Movie[];
  filteredMovies: Movie[];
  counts: { all: number; todo: number; done: number };
  genres: string[];
  view: ViewFilter;
  setView: (view: ViewFilter) => void;
  genre: string;
  setGenre: (genre: string) => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSynced: Date | null;
  addMovie: (id: string) => Promise<void>;
  toggleWatched: (id: string) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
  updatePoster: (id: string, newPosterUrl: string) => Promise<void>;
  syncWithGitHub: () => Promise<void>;
}

export const MoviesContext = createContext<MoviesContextValue | null>(null);

export interface MoviesProviderProps {
  children: ReactNode;
  initialMovies?: Movie[];
  onOpenSettings?: () => void;
}

type RollbackAction = () => void;

export function MoviesProvider({
  children,
  initialMovies,
  onOpenSettings,
}: MoviesProviderProps): React.ReactElement {
  const { config, hasGitHub, hasOmdb } = useConfig();
  const { showToast, dismissToast, showError, showSuccess, showInfo, showWarning } = useToast();

  const [movies, setMovies] = useState<Movie[]>(() => initialMovies || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialMovies);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const [view, setView] = useState<ViewFilter>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('added');

  // Authoritative in-memory ref holding immediate head of state.
  // Updated synchronously on all mutations to eliminate stale closure data loss.
  const moviesRef = useRef<Movie[]>(initialMovies || movies);

  // Synchronize ref whenever React commits a state transition
  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  // Serialized commit chain promise ref
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  // Serialized commit chain with item-scoped rollback
  const enqueueSave = useCallback(
    (
      commitMessage: string,
      rollback: RollbackAction
    ): Promise<void> => {
      if (!hasGitHub) {
        showInfo('Updated locally. Configure GitHub in settings to persist to your repo.', {
          action: onOpenSettings ? { label: 'Open settings', onClick: onOpenSettings } : undefined,
        });
        return Promise.resolve();
      }

      const task = async (): Promise<void> => {
        setIsSyncing(true);
        setSyncError(null);
        const syncToastId = 'sync-in-progress';
        showToast({
          id: syncToastId,
          type: 'info',
          message: 'Saving to GitHub…',
          durationMs: 0,
        });

        try {
          // Pass latest state snapshot at task execution time
          await saveMoviesToGitHub(moviesRef.current, commitMessage, config);
          setLastSynced(new Date());
          dismissToast(syncToastId);
          showSuccess('Saved to repo', { durationMs: 2500 });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Save failed';
          setSyncError(errMsg);
          dismissToast(syncToastId);

          // ITEM-SCOPED ROLLBACK: Revert only the specific mutation performed by this action
          rollback();

          showError(`Failed to save: ${errMsg}. Reverting changes.`, {
            durationMs: 6000,
          });
          throw err;
        } finally {
          setIsSyncing(false);
        }
      };

      // Sequential promise queue: .then(task, task) runs task once regardless of prior settlement,
      // avoiding duplicate task invocation on rejection.
      const nextPromise = saveChainRef.current.then(task, task);

      // Keep chain alive without unhandled rejections
      saveChainRef.current = nextPromise.catch(() => {});

      return nextPromise;
    },
    [config, hasGitHub, showToast, dismissToast, showSuccess, showError, showInfo, onOpenSettings]
  );

  // Initial data loading effect
  useEffect(() => {
    if (initialMovies) {
      moviesRef.current = initialMovies;
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadInitialData(): Promise<void> {
      setIsLoading(true);
      setSyncError(null);

      if (hasGitHub) {
        try {
          const remoteMovies = await fetchMoviesFromGitHub(config);
          if (isMounted) {
            moviesRef.current = remoteMovies;
            setMovies(remoteMovies);
            setLastSynced(new Date());
            setIsLoading(false);
          }
          return;
        } catch (err: unknown) {
          console.warn('Could not load list from GitHub, falling back to local data:', err);
          if (isMounted) {
            showToast({
              type: 'warning',
              message: 'Could not load from GitHub. Falling back to local movies list.',
              durationMs: 4000,
            });
          }
        }
      }

      // Fallback: seed data from data/movies.json
      if (isMounted) {
        const validatedSeed = (fallbackMoviesData as Movie[]).map((m) => ({
          ...m,
          genres: Array.isArray(m.genres) ? m.genres : [],
        }));
        moviesRef.current = validatedSeed;
        setMovies(validatedSeed);
        setIsLoading(false);

        // First-time onboarding guidance
        const hasAnyCredentials = Boolean(config.omdb.trim() || config.token.trim());
        const alreadyOnboarded =
          typeof window !== 'undefined' &&
          window.localStorage.getItem('watchtime_onboarded') === 'true';

        if (!hasAnyCredentials && !alreadyOnboarded) {
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('watchtime_onboarded', 'true');
            }
          } catch {
            // Ignore localStorage errors
          }
          showInfo('First time here? Add your OMDb key and GitHub token.', {
            action: onOpenSettings ? { label: 'Open settings', onClick: onOpenSettings } : undefined,
            durationMs: 8000,
          });
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [hasGitHub, hasOmdb, initialMovies, config, onOpenSettings, showToast, showInfo]);

  // Computed counts: all, todo, done
  const counts = useMemo(
    () => ({
      all: movies.length,
      todo: movies.filter((m) => !m.watched).length,
      done: movies.filter((m) => m.watched).length,
    }),
    [movies]
  );

  // Computed unique sorted genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const m of movies) {
      if (Array.isArray(m.genres)) {
        for (const g of m.genres) {
          const clean = g.trim();
          if (clean) set.add(clean);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [movies]);

  // Auto-reset active genre if it is no longer present in collection
  useEffect(() => {
    if (genre !== 'all' && !genres.includes(genre)) {
      setGenre('all');
    }
  }, [genre, genres]);

  // Computed filtered and sorted movie list
  const filteredMovies = useMemo(() => {
    let list = movies.filter((m) => {
      if (view === 'todo' && m.watched) return false;
      if (view === 'done' && !m.watched) return false;
      if (genre !== 'all' && (!m.genres || !m.genres.includes(genre))) return false;
      return true;
    });

    if (sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      list = [...list].sort((a, b) => {
        const ya = parseInt(a.year, 10) || 0;
        const yb = parseInt(b.year, 10) || 0;
        return yb - ya; // Newest year first
      });
    } else if (sort === 'added') {
      // Default array order preserves chronological additions (newest unshifted first)
    }

    return list;
  }, [movies, view, genre, sort]);

  // CRUD Action 1: Add movie via OMDb
  const addMovie = useCallback(
    async (id: string): Promise<void> => {
      if (moviesRef.current.some((m) => m.id === id)) {
        showInfo('This title is already on your watchlist.');
        return;
      }

      if (!hasOmdb) {
        showError('Add your OMDb API key in settings to add titles.', {
          action: onOpenSettings ? { label: 'Open settings', onClick: onOpenSettings } : undefined,
        });
        throw new Error('OMDb API key not configured');
      }

      const detail = await fetchMovieById(id, config.omdb);
      if (detail.Response === 'False') {
        throw new Error(detail.Error || 'Failed to fetch details from OMDb');
      }

      // Check again after async fetch to guard against concurrent addMovie calls
      if (moviesRef.current.some((m) => m.id === id)) {
        showInfo('This title is already on your watchlist.');
        return;
      }

      const parsedGenres =
        detail.Genre && detail.Genre !== 'N/A'
          ? detail.Genre
              .split(',')
              .map((s) => sanitizeString(s))
              .filter((s) => s.length > 0)
          : [];

      const cleanType = typeof detail.Type === 'string' ? sanitizeString(detail.Type).toLowerCase() : '';
      const type: MediaType = cleanType || 'movie';

      const newMovie: Movie = {
        id,
        title: sanitizeString(detail.Title),
        year: sanitizeString(detail.Year),
        type,
        poster:
          detail.Poster && detail.Poster !== 'N/A' && isValidUrl(detail.Poster)
            ? detail.Poster.trim()
            : '',
        genres: parsedGenres,
        watched: false,
        added: new Date().toISOString().slice(0, 10),
      };

      const currentList = moviesRef.current;
      const updatedMovies = [newMovie, ...currentList];

      // Synchronously update in-memory ref and schedule React render
      moviesRef.current = updatedMovies;
      setMovies(updatedMovies);

      // Scoped rollback: remove added movie if remote save fails
      const rollback = (): void => {
        const reverted = moviesRef.current.filter((m) => m.id !== id);
        moviesRef.current = reverted;
        setMovies(reverted);
      };

      await enqueueSave(`Add ${newMovie.title}`, rollback);
    },
    [config.omdb, hasOmdb, enqueueSave, onOpenSettings, showError, showInfo]
  );

  // CRUD Action 2: Toggle watched status
  const toggleWatched = useCallback(
    async (id: string): Promise<void> => {
      const currentList = moviesRef.current;
      const target = currentList.find((m) => m.id === id);
      if (!target) return;

      const previousWatched = target.watched;
      const nextWatchedState = !previousWatched;
      const updatedMovies = currentList.map((m) =>
        m.id === id ? { ...m, watched: nextWatchedState } : m
      );

      // Synchronously update in-memory ref and schedule React render
      moviesRef.current = updatedMovies;
      setMovies(updatedMovies);

      // Scoped rollback targeting only this specific item
      const rollback = (): void => {
        const reverted = moviesRef.current.map((m) =>
          m.id === id ? { ...m, watched: previousWatched } : m
        );
        moviesRef.current = reverted;
        setMovies(reverted);
      };

      const commitMessage = `${nextWatchedState ? 'Watched' : 'Unwatch'} ${target.title}`;
      await enqueueSave(commitMessage, rollback);
    },
    [enqueueSave]
  );

  // CRUD Action 3: Delete movie
  const deleteMovie = useCallback(
    async (id: string): Promise<void> => {
      const currentList = moviesRef.current;
      const targetIndex = currentList.findIndex((m) => m.id === id);
      const target = currentList[targetIndex];
      if (!target) return;
      const updatedMovies = currentList.filter((m) => m.id !== id);

      // Synchronously update in-memory ref and schedule React render
      moviesRef.current = updatedMovies;
      setMovies(updatedMovies);

      // Scoped rollback: re-insert target movie if deleted save fails
      const rollback = (): void => {
        if (moviesRef.current.some((m) => m.id === id)) return;
        const current = [...moviesRef.current];
        const insertIdx = Math.min(Math.max(0, targetIndex), current.length);
        current.splice(insertIdx, 0, target);
        moviesRef.current = current;
        setMovies(current);
      };

      await enqueueSave(`Remove ${target.title}`, rollback);
    },
    [enqueueSave]
  );

  // CRUD Action 4: Update custom poster
  const updatePoster = useCallback(
    async (id: string, newPosterUrl: string): Promise<void> => {
      const currentList = moviesRef.current;
      const target = currentList.find((m) => m.id === id);
      if (!target) return;

      const trimmedUrl = newPosterUrl.trim();
      if (trimmedUrl && !isValidUrl(trimmedUrl)) {
        throw new Error('The link must start with http:// or https://');
      }

      const previousPoster = target.poster;
      const updatedMovies = currentList.map((m) =>
        m.id === id ? { ...m, poster: trimmedUrl } : m
      );

      // Synchronously update in-memory ref and schedule React render
      moviesRef.current = updatedMovies;
      setMovies(updatedMovies);

      // Scoped rollback: revert poster URL only for this movie
      const rollback = (): void => {
        const reverted = moviesRef.current.map((m) =>
          m.id === id ? { ...m, poster: previousPoster } : m
        );
        moviesRef.current = reverted;
        setMovies(reverted);
      };

      await enqueueSave(`Update poster for ${target.title}`, rollback);
    },
    [enqueueSave]
  );

  // Synchronize on-demand with remote GitHub repository
  const syncWithGitHub = useCallback(async (): Promise<void> => {
    if (!hasGitHub) {
      showWarning('Add your GitHub token and repo details in settings to sync.', {
        action: onOpenSettings ? { label: 'Open settings', onClick: onOpenSettings } : undefined,
      });
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    const syncToastId = 'manual-sync-progress';
    showToast({
      id: syncToastId,
      type: 'info',
      message: 'Fetching latest list from GitHub…',
      durationMs: 0,
    });

    try {
      const remoteMovies = await fetchMoviesFromGitHub(config);
      moviesRef.current = remoteMovies;
      setMovies(remoteMovies);
      setLastSynced(new Date());
      dismissToast(syncToastId);
      showSuccess('Synced with GitHub', { durationMs: 2500 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSyncError(msg);
      dismissToast(syncToastId);
      showError(`Sync failed: ${msg}`, { durationMs: 5000 });
    } finally {
      setIsSyncing(false);
    }
  }, [config, hasGitHub, showToast, dismissToast, showSuccess, showError, showWarning, onOpenSettings]);

  const value = useMemo<MoviesContextValue>(
    () => ({
      movies,
      filteredMovies,
      counts,
      genres,
      view,
      setView,
      genre,
      setGenre,
      sort,
      setSort,
      isLoading,
      isSyncing,
      syncError,
      lastSynced,
      addMovie,
      toggleWatched,
      deleteMovie,
      updatePoster,
      syncWithGitHub,
    }),
    [
      movies,
      filteredMovies,
      counts,
      genres,
      view,
      genre,
      sort,
      isLoading,
      isSyncing,
      syncError,
      lastSynced,
      addMovie,
      toggleWatched,
      deleteMovie,
      updatePoster,
      syncWithGitHub,
    ]
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies(): MoviesContextValue {
  const context = useContext(MoviesContext);
  if (!context) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
}
