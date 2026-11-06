import React, { useState, useCallback } from 'react';
import { Film, Calendar, Tv, Plus, Check, Loader2 } from 'lucide-react';
import type { OmdbSearchResultItem } from '../../types/omdb';
import type { Movie, MediaType } from '../../types/movie';

export interface SearchResultCardProps {
  item: OmdbSearchResultItem;
  isAdded: boolean;
  onAdd: (imdbID: string) => Promise<void>;
  onViewDetails?: (movie: Movie) => void;
}

export function SearchResultCard({
  item,
  isAdded,
  onAdd,
  onViewDetails,
}: SearchResultCardProps): React.ReactElement {
  const [imageError, setImageError] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const hasValidPoster = Boolean(item.Poster && item.Poster !== 'N/A' && !imageError);

  const handleAddClick = useCallback(async (): Promise<void> => {
    if (isAdded || isAdding) return;
    setIsAdding(true);
    try {
      await onAdd(item.imdbID);
    } finally {
      setIsAdding(false);
    }
  }, [isAdded, isAdding, onAdd, item.imdbID]);

  const handlePosterClick = useCallback((): void => {
    if (!onViewDetails) return;
    const cleanType = typeof item.Type === 'string' ? item.Type.toLowerCase() : '';
    const mediaType: MediaType = cleanType === 'series' ? 'series' : 'movie';
    const previewMovie: Movie = {
      id: item.imdbID,
      title: item.Title,
      year: item.Year,
      type: mediaType,
      poster: item.Poster && item.Poster !== 'N/A' ? item.Poster.trim() : '',
      genres: [],
      watched: false,
      added: '',
    };
    onViewDetails(previewMovie);
  }, [onViewDetails, item]);

  const isSeries = item.Type?.toLowerCase() === 'series';

  return (
    <div
      data-slot="search-result-card"
      data-imdbid={item.imdbID}
      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-line bg-canvas/40 hover:bg-canvas transition-colors"
    >
      {/* Poster & Metadata */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Poster Image with Safe Fallback - Clickable to view details */}
        <div
          onClick={handlePosterClick}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePosterClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`View movie details for ${item.Title}`}
          title={`Click to view details for ${item.Title}`}
          className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-surface border border-line flex items-center justify-center relative shadow-none cursor-pointer hover:border-accent hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {hasValidPoster ? (
            <img
              src={item.Poster}
              alt={item.Title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(): void => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted p-1 text-center">
              <Film className="w-5 h-5 text-muted/60" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Text Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <h4
            onClick={handlePosterClick}
            className="text-sm sm:text-base font-semibold text-ink truncate leading-tight cursor-pointer hover:text-accent transition-colors"
            title={`View details for ${item.Title}`}
          >
            {item.Title}
          </h4>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted/70" aria-hidden="true" />
              <span>{item.Year}</span>
            </span>

            <span className="text-muted/40">•</span>

            <span className="inline-flex items-center gap-1 uppercase tracking-wider text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-line">
              {isSeries ? (
                <>
                  <Tv className="w-3 h-3 text-accent" aria-hidden="true" />
                  <span>Series</span>
                </>
              ) : (
                <>
                  <Film className="w-3 h-3 text-accent" aria-hidden="true" />
                  <span>Movie</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Add / Added Action Control */}
      <div className="shrink-0">
        {isAdded ? (
          <div
            data-slot="added-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-ok bg-ok/10 border border-ok/30"
            title="Already on your watchlist"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>On your list</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={isAdding}
            data-slot="add-button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent text-accent-ink hover:opacity-90 active:scale-95 transition-all shadow-none cursor-pointer disabled:opacity-60"
            aria-label={`Add ${item.Title} to watchlist`}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchResultCard;
