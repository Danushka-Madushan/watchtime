import React, { useContext } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import type { SortOption } from '../../types/movie';
import { MoviesContext } from '../../context/MoviesContext';

export interface SortSelectorProps {
  value?: SortOption;
  onChange?: (sort: SortOption) => void;
  className?: string;
}

export function SortSelector({
  value,
  onChange,
  className = '',
}: SortSelectorProps): React.ReactElement {
  const moviesContext = useContext(MoviesContext);
  const currentSort = value ?? moviesContext?.sort ?? 'added';
  const handleSortChange = onChange ?? moviesContext?.setSort ?? ((): void => {});

  return (
    <div data-slot="sort-selector" className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="sort-select-input" className="sr-only">
        Sort movies
      </label>
      <ArrowUpDown
        className="absolute left-2.5 w-3.5 h-3.5 text-muted pointer-events-none select-none"
        aria-hidden="true"
      />
      <select
        id="sort-select-input"
        value={currentSort}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
          handleSortChange(e.target.value as SortOption)
        }
        aria-label="Sort movies"
        className="appearance-none bg-surface border border-line text-ink text-xs font-medium rounded-lg pl-8 pr-8 py-1.5 shadow-2xs hover:border-muted/70 hover:bg-canvas/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all cursor-pointer"
      >
        <option value="added" className="bg-surface text-ink">Recently added</option>
        <option value="title" className="bg-surface text-ink">Title (A–Z)</option>
        <option value="year" className="bg-surface text-ink">Newest release</option>
      </select>
      <ChevronDown
        className="absolute right-2.5 w-3.5 h-3.5 text-muted pointer-events-none select-none"
        aria-hidden="true"
      />
    </div>
  );
}

export default SortSelector;
