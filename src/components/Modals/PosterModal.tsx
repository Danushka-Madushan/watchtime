import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, ImageOff, RotateCcw, X, Check, Loader2, AlertCircle } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { useConfig } from '../../context/ConfigContext';
import { useMovies } from '../../context/MoviesContext';
import { useToast } from '../../context/ToastContext';
import { refetchPoster } from '../../services/omdbService';
import { isValidHttpUrl } from '../../utils/sanitize';

export interface PosterModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
  onSave?: (id: string, newPosterUrl: string) => Promise<void> | void;
}

export function PosterModal({
  isOpen,
  movie,
  onClose,
  onSave,
}: PosterModalProps): React.ReactElement | null {
  const { config, hasOmdb } = useConfig();
  const { updatePoster } = useMovies();
  const { showSuccess, showError, showWarning } = useToast();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [urlInput, setUrlInput] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize state when movie changes or modal opens
  useEffect(() => {
    if (movie) {
      setUrlInput(movie.poster || '');
      setImageError(false);
      setValidationError(null);
      setIsRefetching(false);
      setIsSaving(false);
    }
  }, [movie, isOpen]);

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
      // Focus input on open
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
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

  // Intercept Esc cancel event
  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>): void => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  // Validate URL on change
  const handleUrlChange = (val: string): void => {
    setUrlInput(val);
    setImageError(false);
    const trimmed = val.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      setValidationError('The link must start with http:// or https://');
    } else {
      setValidationError(null);
    }
  };

  // Refetch official poster from OMDb API
  const handleRefetch = async (): Promise<void> => {
    if (!movie) return;
    if (!hasOmdb) {
      showWarning('Add your OMDb API key in settings to refetch posters.');
      return;
    }

    setIsRefetching(true);
    setValidationError(null);

    try {
      const officialPoster = await refetchPoster(movie.id, config.omdb);
      if (officialPoster && isValidHttpUrl(officialPoster)) {
        setUrlInput(officialPoster);
        setImageError(false);
        showSuccess('Official poster fetched from IMDb!');
      } else {
        showWarning('No poster found on IMDb for this title.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refetch poster';
      showError(`Refetch failed: ${message}`);
    } finally {
      setIsRefetching(false);
    }
  };

  // Submit new poster
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!movie || isSaving) return;

    const trimmed = urlInput.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      setValidationError('The link must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(movie.id, trimmed);
      } else {
        await updatePoster(movie.id, trimmed);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      showError(`Could not update poster: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !movie) return null;

  const previewSrc = urlInput.trim();
  const hasPreview = Boolean(previewSrc && !imageError && !validationError);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="poster-modal-title"
      className="fixed inset-0 m-auto p-0 bg-transparent backdrop:bg-black/65 backdrop:backdrop-blur-sm z-50 max-w-lg w-[calc(100%-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-line open:flex open:flex-col"
    >
      <div className="bg-surface text-ink flex flex-col w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Film className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="poster-modal-title" className="text-lg font-bold text-ink">
                Edit Poster
              </h2>
              {movie && (
                <p className="text-xs sm:text-sm text-muted truncate max-w-[280px]">
                  {movie.title} ({movie.year})
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
          {/* Live Preview Display */}
          <div className="flex flex-col items-center">
            <div className="relative w-36 aspect-[2/3] rounded-xl bg-canvas border border-line shadow-inner overflow-hidden flex items-center justify-center">
              {hasPreview ? (
                <img
                  src={previewSrc}
                  alt={movie ? `${movie.title} preview` : 'Poster preview'}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-opacity duration-150"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted p-3 text-center space-y-1.5">
                  <ImageOff className="w-7 h-7 stroke-[1.5]" aria-hidden="true" />
                  <span className="text-[11px] leading-tight font-medium">
                    {previewSrc ? 'Invalid or broken image' : 'No poster URL'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-muted mt-2">Live 2:3 aspect preview</span>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label htmlFor="poster-url-input" className="block text-xs font-semibold text-ink">
              Poster Image URL
            </label>
            <input
              ref={inputRef}
              id="poster-url-input"
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className={`w-full px-3.5 py-2 rounded-lg bg-canvas border text-sm text-ink placeholder-muted focus-visible:outline-none focus-visible:ring-2 transition-colors ${
                validationError
                  ? 'border-danger focus-visible:ring-danger'
                  : 'border-line focus-visible:ring-accent'
              }`}
            />
            {validationError ? (
              <p className="text-xs text-danger flex items-center gap-1.5 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{validationError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted">
                Paste a direct image link or leave empty to clear the custom poster.
              </p>
            )}
          </div>

          {/* Refetch from IMDb Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleRefetch}
              disabled={isRefetching || !movie}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-canvas hover:bg-line border border-line text-xs font-medium text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isRefetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              )}
              <span>{isRefetching ? 'Querying OMDb...' : 'Refetch original poster from IMDb'}</span>
            </button>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || Boolean(validationError)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-red-700 text-accent-ink text-xs sm:text-sm font-semibold shadow-none transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Poster'}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default PosterModal;
