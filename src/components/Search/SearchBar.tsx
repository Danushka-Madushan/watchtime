import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Loader2, Calendar, Film, Tv } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { useMovies } from '../../context/MoviesContext';
import { searchMovies } from '../../services/omdbService';
import { parseSearchQuery } from '../../utils/queryParser';
import { SearchResultsDropdown } from './SearchResultsDropdown';
import type { OmdbSearchResultItem } from '../../types/omdb';
import type { Movie } from '../../types/movie';

export type SearchMediaType = '' | 'movie' | 'series';

export interface SearchBarProps {
  onOpenSettings?: () => void;
  onViewDetails?: (movie: Movie) => void;
  className?: string;
}

export function SearchBar({ onOpenSettings, onViewDetails, className = '' }: SearchBarProps): React.ReactElement {
  const { config, hasOmdb } = useConfig();
  const { movies, addMovie } = useMovies();

  // Input states
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [mediaType, setMediaType] = useState<SearchMediaType>('');
  const [explicitYear, setExplicitYear] = useState<string>('');

  // Results & Pagination states
  const [items, setItems] = useState<OmdbSearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // References
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestSeqRef = useRef<number>(0);

  // Live parsed title and extracted year from current input string (for preview badge)
  const liveParsed = useMemo(() => {
    return parseSearchQuery(query, explicitYear);
  }, [query, explicitYear]);

  // Set of existing movie IMDb IDs for fast duplicate lookup
  const existingMovieIds = useMemo(() => {
    return new Set(movies.map((m) => m.id));
  }, [movies]);

  // 400ms Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Search execution trigger on debounced query, media type, or explicit year changes
  useEffect(() => {
    const parsed = parseSearchQuery(debouncedQuery, explicitYear);
    const trimmedTitle = parsed.title.trim();
    if (trimmedTitle.length < 2) {
      setItems([]);
      setTotalResults(0);
      setSearchError(null);
      setIsLoading(false);
      setIsDropdownOpen(false);
      return;
    }

    if (!hasOmdb) {
      setSearchError('Add your OMDb API key in settings to search.');
      setIsDropdownOpen(true);
      setIsLoading(false);
      return;
    }

    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setSearchError(null);
    setIsDropdownOpen(true);
    setPage(1);

    async function executeSearch(): Promise<void> {
      try {
        const response = await searchMovies({
          query: trimmedTitle,
          year: parsed.year,
          type: mediaType || undefined,
          page: 1,
          apiKey: config.omdb,
        });

        // Guard against out-of-order responses
        if (currentSeq === requestSeqRef.current) {
          setItems(response.items);
          setTotalResults(response.total);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (currentSeq === requestSeqRef.current) {
          const msg = err instanceof Error ? err.message : 'Search failed';
          setSearchError(msg);
          setItems([]);
          setTotalResults(0);
          setIsLoading(false);
        }
      }
    }

    void executeSearch();
  }, [debouncedQuery, mediaType, explicitYear, hasOmdb, config.omdb]);

  // Pagination: Load next page
  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (isLoadingMore || items.length >= totalResults) return;

    const parsed = parseSearchQuery(debouncedQuery, explicitYear);
    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const response = await searchMovies({
        query: parsed.title,
        year: parsed.year,
        type: mediaType || undefined,
        page: nextPage,
        apiKey: config.omdb,
      });

      setItems((prev) => [...prev, ...response.items]);
      setPage(nextPage);
    } catch (err: unknown) {
      console.error('Failed to load more results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, items.length, totalResults, page, debouncedQuery, explicitYear, mediaType, config.omdb]);

  // Clear query and reset search bar
  const handleClear = useCallback((): void => {
    setQuery('');
    setDebouncedQuery('');
    setExplicitYear('');
    setItems([]);
    setTotalResults(0);
    setSearchError(null);
    setIsDropdownOpen(false);
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent): void {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={searchContainerRef}
      data-slot="search-bar"
      className={`relative rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all ${className}`}
      aria-label="Search movies and series"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent" aria-hidden="true" />
            ) : (
              <Search className="w-4 h-4" aria-hidden="true" />
            )}
          </div>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
              setQuery(e.target.value);
              if (!isDropdownOpen && e.target.value.trim().length >= 2) {
                setIsDropdownOpen(true);
              }
            }}
            onFocus={(): void => {
              if (query.trim().length >= 2) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Search Movies or Series..."
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-canvas border border-line text-base font-light text-ink placeholder:text-sm sm:placeholder:text-base placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
            aria-label="Search movies or series"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Right actions: Extracted Year Preview & Clear Button */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {liveParsed.year && (
              <span
                className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20"
                title={`Auto-detected release year: ${liveParsed.year}`}
              >
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span>{liveParsed.year}</span>
              </span>
            )}

            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                aria-label="Clear search input"
                title="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Explicit Year Input Override & Media Type Tabs */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={explicitYear}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
              setExplicitYear(cleaned);
            }}
            placeholder="Year"
            className="w-20 px-2.5 py-2.5 rounded-xl bg-canvas border border-line text-sm sm:text-base text-center text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors font-mono"
            aria-label="Filter by release year"
            title="Filter by 4-digit release year"
          />

          {/* Media Type Filter Chips */}
          <div className="inline-flex rounded-xl p-1 bg-canvas border border-line" role="tablist" aria-label="Media Type Filter">
            <button
              type="button"
              role="tab"
              aria-selected={mediaType === ''}
              onClick={(): void => setMediaType('')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mediaType === ''
                  ? 'bg-accent text-accent-ink shadow-none'
                  : 'text-muted hover:text-ink hover:bg-surface/50'
              }`}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mediaType === 'movie'}
              onClick={(): void => setMediaType('movie')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-accent text-accent-ink shadow-none'
                  : 'text-muted hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Film className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Movies</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mediaType === 'series'}
              onClick={(): void => setMediaType('series')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mediaType === 'series'
                  ? 'bg-accent text-accent-ink shadow-none'
                  : 'text-muted hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Series</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instant Search Results Dropdown Panel */}
      <SearchResultsDropdown
        isOpen={isDropdownOpen}
        onClose={(): void => setIsDropdownOpen(false)}
        items={items}
        totalResults={totalResults}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={searchError}
        query={query}
        onAddMovie={addMovie}
        onLoadMore={handleLoadMore}
        existingMovieIds={existingMovieIds}
        onOpenSettings={onOpenSettings}
        onViewDetails={onViewDetails}
      />
    </div>
  );
}

export default SearchBar;
