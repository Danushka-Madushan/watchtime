import React from 'react';

export interface MovieCardSkeletonProps {
  className?: string;
}

export function MovieCardSkeleton({ className = '' }: MovieCardSkeletonProps): React.ReactElement {
  return (
    <article
      aria-hidden={true}
      data-testid="movie-card-skeleton"
      className={`flex flex-col rounded-xl bg-surface border border-line overflow-hidden shadow-xs animate-pulse ${className}`}
    >
      <div className="aspect-[2/3] w-full bg-line/60" />
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 bg-line/80 rounded-md w-3/4" />
          <div className="h-3 bg-line/60 rounded-md w-1/2" />
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
          <div className="h-7 bg-line/70 rounded-lg w-24" />
          <div className="flex items-center gap-1">
            <div className="h-7 w-7 bg-line/60 rounded-lg" />
            <div className="h-7 w-7 bg-line/60 rounded-lg" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default MovieCardSkeleton;
