import React, { useContext } from 'react';
import { MoviesContext } from '../../context/MoviesContext';

export interface GenreFilterProps {
  selectedGenre?: string;
  onSelectGenre?: (genre: string) => void;
  genres?: string[];
  className?: string;
}

export function GenreFilter({
  selectedGenre,
  onSelectGenre,
  genres: propGenres,
  className = '',
}: GenreFilterProps): React.ReactElement {
  const moviesContext = useContext(MoviesContext);
  const currentGenre = selectedGenre ?? moviesContext?.genre ?? 'all';
  const genreList = propGenres ?? moviesContext?.genres ?? [];
  const handleSelect = onSelectGenre ?? moviesContext?.setGenre ?? ((): void => {});

  return (
    <nav
      aria-label="Filter by genre"
      data-slot="genre-filter"
      className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}
    >
      <button
        type="button"
        onClick={(): void => handleSelect('all')}
        aria-pressed={currentGenre === 'all'}
        className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          currentGenre === 'all'
            ? 'bg-accent text-accent-ink border border-transparent font-medium shadow-xs'
            : 'bg-surface text-muted hover:text-ink border border-line hover:border-muted/50'
        }`}
      >
        All Genres
      </button>
      {genreList.map((g) => {
        const isActive = currentGenre === g;
        return (
          <button
            key={g}
            type="button"
            onClick={(): void => handleSelect(g)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'bg-accent text-accent-ink border border-transparent font-medium shadow-xs'
                : 'bg-surface text-muted hover:text-ink border border-line hover:border-muted/50'
            }`}
          >
            {g}
          </button>
        );
      })}
    </nav>
  );
}

export default GenreFilter;
