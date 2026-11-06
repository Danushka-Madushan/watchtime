import React from 'react';
import { Loader2, AlertCircle, Film, Sparkles, ChevronDown } from 'lucide-react';
import { SearchResultCard } from './SearchResultCard';
import type { OmdbSearchResultItem } from '../../types/omdb';

export interface SearchResultsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  items: OmdbSearchResultItem[];
  totalResults: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  query: string;
  onAddMovie: (imdbID: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  existingMovieIds: Set<string>;
  onOpenSettings?: () => void;
}

export function SearchResultsDropdown({
  isOpen,
  items,
  totalResults,
  isLoading,
  isLoadingMore,
  error,
  query,
  onAddMovie,
  onLoadMore,
  existingMovieIds,
  onOpenSettings,
}: SearchResultsDropdownProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      data-slot="search-results-dropdown"
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-line bg-surface shadow-2xl p-4 transition-all max-h-[30rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      role="region"
      aria-label="Search results"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-line text-xs">
        <span className="font-medium text-ink flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <span>
            {isLoading
              ? 'Searching titles...'
              : `Found ${totalResults} title${totalResults === 1 ? '' : 's'}`}
          </span>
        </span>
        {query && (
          <span className="text-muted truncate max-w-[200px]">
            query: &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">{error}</p>
              {onOpenSettings && error.includes('settings') && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="font-semibold underline hover:no-underline cursor-pointer"
                >
                  Open settings now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && items.length === 0 && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl border border-line/60 bg-canvas/50 animate-pulse"
              >
                <div className="w-12 h-16 rounded-lg bg-surface border border-line" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-3 bg-line/70 rounded w-1/3" />
                </div>
                <div className="w-16 h-8 bg-line rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="py-8 text-center text-muted text-xs space-y-2">
            <Film className="w-8 h-8 mx-auto text-muted/40" aria-hidden="true" />
            <p>No titles found matching &ldquo;{query}&rdquo;.</p>
            <p className="text-[11px] text-muted/80">
              Try checking your spelling or adjusting the release year and media type filters.
            </p>
          </div>
        )}

        {/* Result Items */}
        {items.map((item) => (
          <SearchResultCard
            key={item.imdbID}
            item={item}
            isAdded={existingMovieIds.has(item.imdbID)}
            onAdd={onAddMovie}
          />
        ))}

        {/* Pagination: Load More Button */}
        {items.length > 0 && items.length < totalResults && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={(): void => {
                void onLoadMore();
              }}
              disabled={isLoadingMore}
              className="w-full py-2.5 px-4 rounded-xl bg-canvas hover:bg-canvas/80 border border-line text-xs font-semibold text-ink flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
                  <span>Loading more titles...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                  <span>
                    Show more results ({items.length} of {totalResults})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResultsDropdown;
