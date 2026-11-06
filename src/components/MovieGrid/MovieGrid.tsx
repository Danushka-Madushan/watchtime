import React, { useContext } from 'react';
import { Film, FilterX } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { MoviesContext } from '../../context/MoviesContext';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './MovieCardSkeleton';
import { EmptyState } from './EmptyState';

export interface MovieGridProps {
  movies?: Movie[];
  isLoading?: boolean;
  skeletonCount?: number;
  initialLimit?: number;
  onEditPoster?: (movie: Movie) => void;
  onChangePoster?: (movie: Movie) => void;
  onDeleteMovie?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
  onToggleWatched?: (id: string) => Promise<void> | void;
  onViewDetails?: (movie: Movie) => void;
  className?: string;
}

export function MovieGrid({
  movies: propMovies,
  isLoading: propIsLoading,
  skeletonCount = 12,
  initialLimit: _initialLimit = 36,
  onEditPoster,
  onChangePoster,
  onDeleteMovie,
  onDelete,
  onToggleWatched,
  onViewDetails,
  className = '',
}: MovieGridProps): React.ReactElement {
  const moviesContext = useContext(MoviesContext);

  const handleEdit = onEditPoster ?? onChangePoster;
  const handleDeleteAction = onDeleteMovie ?? onDelete;
  const handleToggle = onToggleWatched ?? moviesContext?.toggleWatched;

  const displayMovies = propMovies ?? moviesContext?.filteredMovies ?? [];
  const totalCount = moviesContext?.movies.length ?? displayMovies.length;
  const isLoading = propIsLoading ?? moviesContext?.isLoading ?? false;
  const view = moviesContext?.view ?? 'all';
  const genre = moviesContext?.genre ?? 'all';
  const setView = moviesContext?.setView;
  const setGenre = moviesContext?.setGenre;

  const isFiltered = view !== 'all' || genre !== 'all';

  return (
    <main
      data-slot="movie-grid"
      aria-label="Movie Collection"
      className={`space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-2">
          <Film className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>Movies &amp; Series</span>
        </h2>
        <span className="text-xs sm:text-sm text-muted font-medium" data-testid="grid-counter">
          {isLoading
            ? 'Loading collection…'
            : isFiltered
            ? `Showing ${displayMovies.length} of ${totalCount} titles`
            : `Showing ${displayMovies.length} titles`}
        </span>
      </div>

      {isLoading ? (
        <div
          data-testid="grid-loading"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
        >
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <MovieCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      ) : displayMovies.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? 'Your watchlist is empty' : 'No titles found'}
          description={
            totalCount === 0
              ? 'Search above to discover and add movies or series to your personal watchlist.'
              : `No movies match the current filter (${view !== 'all' ? `status: ${view}` : ''}${
                  view !== 'all' && genre !== 'all' ? ', ' : ''
                }${genre !== 'all' ? `genre: ${genre}` : ''}).`
          }
          actionLabel={isFiltered && setView && setGenre ? 'Reset filters' : undefined}
          onAction={
            isFiltered && setView && setGenre
              ? (): void => {
                  setView('all');
                  setGenre('all');
                }
              : undefined
          }
          icon={isFiltered ? FilterX : Film}
        />
      ) : (
        <div
          data-testid="grid-content"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
        >
          {displayMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onToggleWatched={handleToggle}
              onEditPoster={handleEdit}
              onDelete={handleDeleteAction}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default MovieGrid;
