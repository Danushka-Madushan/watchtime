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
      className={`inline-flex items-center rounded-xl p-1 bg-surface border border-line shadow-xs ${className}`}
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
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
              isActive
                ? 'bg-accent text-accent-ink shadow-xs font-semibold'
                : 'text-muted hover:text-ink hover:bg-canvas/50'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${tab.key === 'done' && !isActive ? 'text-ok' : ''}`}
              aria-hidden={true}
            />
            <span>{tab.label}</span>
            <span
              data-testid={`status-count-${tab.key}`}
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                isActive ? 'bg-accent-ink/20 text-accent-ink' : 'bg-canvas text-muted border border-line/60'
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
