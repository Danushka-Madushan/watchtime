import React, { useState } from 'react';
import {
  Film,
  Check,
  CheckCircle2,
  RotateCcw,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import type { Movie } from '../../types/movie';

export interface MovieCardProps {
  movie: Movie;
  onToggleWatched?: (id: string) => Promise<void> | void;
  onEditPoster?: (movie: Movie) => void;
  onChangePoster?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
  onDeleteMovie?: (movie: Movie) => void;
  onViewDetails?: (movie: Movie) => void;
  className?: string;
}

export const MovieCard = React.memo(
  function MovieCard({
    movie,
    onToggleWatched,
    onEditPoster,
    onChangePoster,
    onDelete,
    onDeleteMovie,
    onViewDetails,
    className = '',
  }: MovieCardProps): React.ReactElement {
    const [imgError, setImgError] = useState<boolean>(false);
    const [isToggling, setIsToggling] = useState<boolean>(false);

    const handleEdit = onEditPoster ?? onChangePoster;
    const handleDeleteAction = onDelete ?? onDeleteMovie;

    const hasValidPoster = Boolean(
      movie.poster &&
        (movie.poster.startsWith('http://') || movie.poster.startsWith('https://')) &&
        !imgError
    );

    const handleToggle = async (): Promise<void> => {
      if (isToggling) return;
      setIsToggling(true);
      try {
        if (onToggleWatched) {
          await onToggleWatched(movie.id);
        }
      } finally {
        setIsToggling(false);
      }
    };

    const handleEditClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      handleEdit?.(movie);
    };

    const handleDeleteClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      handleDeleteAction?.(movie);
    };

    const title = movie.title || '';
    const year = movie.year || '';
    const genreSummary =
      Array.isArray(movie.genres) && movie.genres.length > 0
        ? movie.genres.slice(0, 3).join(', ')
        : movie.type;

    return (
      <article
        data-slot="movie-card"
        data-testid={`movie-card-${movie.id}`}
        className={`group relative flex flex-col rounded-xl bg-surface border border-line overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      >
        {/* Poster Container (Aspect Ratio 2:3) */}
        <div
          onClick={(): void => onViewDetails?.(movie)}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onViewDetails?.(movie);
            }
          }}
          role={onViewDetails ? 'button' : undefined}
          tabIndex={onViewDetails ? 0 : undefined}
          aria-label={onViewDetails ? `View movie details for ${title}` : undefined}
          className={`relative aspect-2/3 w-full bg-canvas overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            onViewDetails ? 'cursor-pointer' : ''
          }`}
        >
          {hasValidPoster ? (
            <img
              src={movie.poster}
              alt={`${title} poster`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(): void => setImgError(true)}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                movie.watched ? 'opacity-45' : 'opacity-100'
              }`}
            />
          ) : (
            <div
              role="img"
              aria-label={`Poster placeholder for ${title}`}
              className="w-full h-full bg-line/30 flex flex-col items-center justify-center p-4 text-center select-none"
            >
              <Film className="w-10 h-10 text-muted/50 mb-2" aria-hidden={true} />
              <span className="text-xs font-medium text-muted line-clamp-3">{title}</span>
              <span className="text-[10px] text-muted/70 uppercase tracking-wider mt-1.5 font-semibold">
                No Poster
              </span>
            </div>
          )}

          {/* Watched Badge Overlay */}
          {movie.watched && (
            <div
              data-testid="watched-badge"
              className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface/90 border border-ok/40 text-[10px] font-semibold text-ok backdrop-blur-sm shadow-xs"
            >
              <Check className="w-3 h-3" aria-hidden="true" />
              <span>Watched</span>
            </div>
          )}

          {/* Media Type Badge Overlay (if not movie) */}
          {movie.type && movie.type.toLowerCase() !== 'movie' && (
            <div
              className={`absolute ${movie.watched ? 'top-8' : 'top-2'} left-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-canvas/90 border border-line text-muted backdrop-blur-sm shadow-xs`}
            >
              {movie.type}
            </div>
          )}

          {/* Change Poster Button Overlay */}
          <button
            type="button"
            onClick={handleEditClick}
            aria-label={`Change poster for ${title}`}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface/85 hover:bg-surface text-muted hover:text-ink border border-line backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-xs cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Card Metadata */}
        <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2">
              {title}
            </h3>
            <p className="text-xs text-muted">
              {year} • {genreSummary}
            </p>
          </div>

          {/* Card Action Row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
            <button
              type="button"
              disabled={isToggling}
              onClick={handleToggle}
              aria-label={movie.watched ? `Mark ${title} as unwatched` : `Mark ${title} as watched`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                movie.watched
                  ? 'bg-canvas hover:bg-line text-ink border border-line'
                  : 'bg-accent hover:opacity-90 text-accent-ink shadow-xs'
              } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
            >
              {movie.watched ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Undo</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Mark watched</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label={`Remove ${title}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger bg-canvas hover:bg-danger/10 border border-line/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger shrink-0"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  },
  (prev, next) => {
    return (
      prev.movie.id === next.movie.id &&
      prev.movie.watched === next.movie.watched &&
      prev.movie.poster === next.movie.poster &&
      prev.movie.title === next.movie.title &&
      prev.movie.year === next.movie.year &&
      prev.className === next.className &&
      prev.onViewDetails === next.onViewDetails
    );
  }
);

export default MovieCard;
