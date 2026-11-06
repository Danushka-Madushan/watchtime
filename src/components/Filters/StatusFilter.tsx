import React, { useContext } from 'react';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import type { ViewFilter } from '../../types/movie';
import { MoviesContext } from '../../context/MoviesContext';

export interface StatusFilterProps {
  value?: ViewFilter;
  onChange?: (view: ViewFilter) => void;
  counts?: { all: number; todo: number; done: number };
  className?: string;
}

export function StatusFilter({
  value,
  onChange,
  counts: propCounts,
  className = '',
}: StatusFilterProps): React.ReactElement {
  const moviesContext = useContext(MoviesContext);
  const currentView: ViewFilter = value ?? moviesContext?.view ?? 'all';
  const currentCounts = propCounts ?? moviesContext?.counts ?? { all: 0, todo: 0, done: 0 };
  const handleSelect = onChange ?? moviesContext?.setView ?? ((): void => {});

  const tabs: Array<{
    key: ViewFilter;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  }> = [
    { key: 'all', label: 'All', count: currentCounts.all, icon: Sparkles },
    { key: 'todo', label: 'To watch', count: currentCounts.todo, icon: Clock },
    { key: 'done', label: 'Watched', count: currentCounts.done, icon: CheckCircle2 },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by watch status"
      data-slot="status-filter"
      className={`inline-flex items-center rounded-xl p-1 bg-surface border border-line shadow-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = currentView === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            aria-selected={isActive}
            aria-pressed={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={(): void => handleSelect(tab.key)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
              isActive
                ? 'bg-accent text-accent-ink shadow-none font-bold'
                : 'text-muted hover:text-ink hover:bg-canvas/60 font-medium'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${tab.key === 'done' && !isActive ? 'text-ok' : ''}`}
              aria-hidden={true}
            />
            <span>{tab.label}</span>
            <span
              data-testid={`status-count-${tab.key}`}
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                isActive ? 'bg-white/20 text-accent-ink' : 'bg-canvas text-muted border border-line'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default StatusFilter;
