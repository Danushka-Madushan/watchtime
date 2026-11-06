import React from 'react';
import { StatusFilter } from './StatusFilter';
import { GenreFilter } from './GenreFilter';
import { SortSelector } from './SortSelector';

export interface FilterSortBarProps {
  className?: string;
}

export function FilterSortBar({ className = '' }: FilterSortBarProps): React.ReactElement {
  return (
    <section
      data-slot="filter-sort-bar"
      aria-label="Filters and Sorting"
      className={`flex flex-col gap-3 pb-3 border-b border-line ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <StatusFilter />
        <SortSelector />
      </div>
      <GenreFilter />
    </section>
  );
}

export default FilterSortBar;
