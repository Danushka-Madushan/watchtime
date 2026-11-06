import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Film,
  Star,
  Clock,
  Calendar,
  Check,
  CheckCircle2,
  RotateCcw,
  ImagePlus,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  User,
  Users,
} from 'lucide-react';
import type { Movie } from '../../types/movie';
import type { OmdbDetailResponse } from '../../types/omdb';
import { useConfig } from '../../context/ConfigContext';
import { getMovieById } from '../../services/omdbService';

export interface MovieDetailsModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
  onToggleWatched?: (id: string) => Promise<void> | void;
  onEditPoster?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export function MovieDetailsModal({
  isOpen,
  movie,
  onClose,
  onToggleWatched,
  onEditPoster,
  onDelete,
}: MovieDetailsModalProps): React.ReactElement | null {
  const { config, hasOmdb } = useConfig();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [details, setDetails] = useState<OmdbDetailResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [posterError, setPosterError] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  // Synchronize modal open/close lifecycle
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
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel (Escape key) and click outside backdrop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event): void => {
      e.preventDefault();
      onClose();
    };

    const handleClickOutside = (e: MouseEvent): void => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClickOutside);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  // Fetch full details if OMDb key is present
  useEffect(() => {
    if (!isOpen || !movie) {
      setDetails(null);
      setPosterError(false);
      setIsLoadingDetails(false);
      return;
    }

    setPosterError(false);

    if (!hasOmdb || !config.omdb) {
      setDetails(null);
      setIsLoadingDetails(false);
      return;
    }

    let isSubscribed = true;
    setIsLoadingDetails(true);

    getMovieById(movie.id, config.omdb)
      .then((data) => {
        if (isSubscribed) {
          setDetails(data);
          setIsLoadingDetails(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setDetails(null);
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, movie, hasOmdb, config.omdb]);

  const handleToggle = useCallback(async (): Promise<void> => {
    if (!movie || isToggling || !onToggleWatched) return;
    setIsToggling(true);
    try {
      await onToggleWatched(movie.id);
    } finally {
      setIsToggling(false);
    }
  }, [movie, isToggling, onToggleWatched]);

  const handleEditPosterClick = (): void => {
    if (movie) {
      onEditPoster?.(movie);
      onClose();
    }
  };

  const handleDeleteClick = (): void => {
    if (movie) {
      onDelete?.(movie);
      onClose();
    }
  };

  if (!isOpen && !movie) {
    return null;
  }

  const title = details?.Title || movie?.title || '';
  const year = details?.Year || movie?.year || '';
  const mediaType = details?.Type || movie?.type || 'movie';
  const posterUrl = movie?.poster || details?.Poster || '';
  const hasPoster = Boolean(
    posterUrl &&
      (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) &&
      !posterError
  );

  const genresList: string[] =
    details?.Genre && details.Genre !== 'N/A'
      ? details.Genre.split(',').map((g) => g.trim())
      : movie?.genres || [];

  return (
    <dialog
      ref={dialogRef}
      data-slot="movie-details-modal"
      data-testid="movie-details-modal"
      className="fixed inset-0 z-50 m-auto p-0 bg-transparent backdrop:bg-black/65 backdrop:backdrop-blur-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl focus:outline-none"
    >
      <div className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col text-ink">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide uppercase text-muted">
              Movie Details
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details dialog"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col sm:flex-row gap-6 overflow-y-auto">
          {/* Left Column: High-Res Poster */}
          <div className="w-full sm:w-48 shrink-0 flex flex-col items-center">
            <div className="relative aspect-2/3 w-full max-w-50 sm:max-w-none rounded-xl bg-canvas border border-line overflow-hidden shadow-md">
              {hasPoster ? (
                <img
                  src={posterUrl}
                  alt={`${title} poster`}
                  referrerPolicy="no-referrer"
                  onError={(): void => setPosterError(true)}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    movie?.watched ? 'opacity-70' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none bg-line/20">
                  <Film className="w-10 h-10 text-muted/50 mb-2" aria-hidden="true" />
                  <span className="text-xs text-muted font-medium line-clamp-3">{title}</span>
                  <span className="text-[10px] text-muted/70 uppercase tracking-wider mt-1 font-semibold">
                    No Poster
                  </span>
                </div>
              )}

              {/* Watched Badge */}
              {movie?.watched && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface/95 border border-ok/40 text-[10px] font-semibold text-ok shadow-xs backdrop-blur-sm">
                  <Check className="w-3 h-3" aria-hidden="true" />
                  <span>Watched</span>
                </div>
              )}
            </div>

            {/* Quick Action: Change Poster Button */}
            <button
              type="button"
              onClick={handleEditPosterClick}
              className="mt-3 w-full max-w-50 sm:max-w-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas hover:bg-line/70 border border-line text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Change Poster</span>
            </button>
          </div>

          {/* Right Column: Metadata & Synopsis */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-canvas border border-line text-muted">
                  {mediaType}
                </span>
                {details?.Rated && details.Rated !== 'N/A' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-canvas border border-line text-muted">
                    {details.Rated}
                  </span>
                )}
                {details?.Runtime && details.Runtime !== 'N/A' && (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{details.Runtime}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                {title}
              </h2>

              <p className="text-sm text-muted font-medium mt-0.5">
                Released: {details?.Released && details.Released !== 'N/A' ? details.Released : year}
              </p>
            </div>

            {/* Ratings & Score */}
            {details?.imdbRating && details.imdbRating !== 'N/A' && (
              <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-canvas border border-line/60">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                  <span className="text-sm font-bold text-ink">{details.imdbRating}</span>
                  <span className="text-xs text-muted">/ 10</span>
                </div>
                {details.imdbVotes && details.imdbVotes !== 'N/A' && (
                  <span className="text-xs text-muted border-l border-line pl-3">
                    {details.imdbVotes} votes
                  </span>
                )}
                {details.Metascore && details.Metascore !== 'N/A' && (
                  <span className="text-xs font-semibold text-ok ml-auto px-1.5 py-0.5 rounded bg-ok/10 border border-ok/30">
                    Metascore: {details.Metascore}
                  </span>
                )}
              </div>
            )}

            {/* Genre Pills */}
            {genresList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {genresList.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-canvas border border-line text-ink"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis / Plot */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Synopsis
              </h3>
              {isLoadingDetails ? (
                <div className="flex items-center gap-2 text-xs text-muted py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
                  <span>Loading plot synopsis...</span>
                </div>
              ) : details?.Plot && details.Plot !== 'N/A' ? (
                <p className="text-sm text-ink/90 leading-relaxed">{details.Plot}</p>
              ) : (
                <p className="text-xs text-muted leading-relaxed italic">
                  {hasOmdb
                    ? 'No extended plot synopsis available for this title.'
                    : 'Add your OMDb API key in Settings to automatically fetch the full plot summary, ratings, and cast.'}
                </p>
              )}
            </div>

            {/* Credits & Cast */}
            <div className="space-y-2 pt-2 border-t border-line text-xs">
              {details?.Director && details.Director !== 'N/A' && (
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-muted shrink-0">Director:</span>
                  <span className="text-ink font-medium">{details.Director}</span>
                </div>
              )}

              {details?.Actors && details.Actors !== 'N/A' && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-muted shrink-0">Cast:</span>
                  <span className="text-ink font-medium">{details.Actors}</span>
                </div>
              )}

              {movie?.added && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                  <span className="text-muted">Added to watchlist:</span>
                  <span className="text-ink font-medium">{movie.added}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-canvas/50 border-t border-line">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isToggling}
              onClick={handleToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                movie?.watched
                  ? 'bg-canvas hover:bg-line text-ink border border-line'
                  : 'bg-accent hover:opacity-90 text-accent-ink shadow-xs'
              } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
            >
              {movie?.watched ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Mark as Unwatched</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Mark as Watched</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {movie && (
              <a
                href={`https://www.imdb.com/title/${encodeURIComponent(movie.id)}/`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${title} on IMDb in a new tab`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink bg-canvas hover:bg-line/70 border border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>IMDb</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label={`Remove ${title} from watchlist`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger/10 border border-danger/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Remove</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default MovieDetailsModal;
