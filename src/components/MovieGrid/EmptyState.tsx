import React from 'react';
import { Film } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  className?: string;
}

export function EmptyState({
  title = 'No titles found',
  description = 'Try adjusting your filters or search terms to find what you are looking for.',
  actionLabel,
  onAction,
  icon: Icon = Film,
  className = '',
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      role="status"
      data-slot="empty-state"
      data-testid="empty-state"
      className={`rounded-2xl border-2 border-dashed border-line bg-surface/50 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-canvas border border-line flex items-center justify-center text-muted shadow-xs">
        <Icon className="w-6 h-6 text-muted" aria-hidden={true} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-none cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
