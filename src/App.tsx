import React, { useState } from 'react';
import type { Movie } from './types/movie';
import { ConfigProvider } from './context/ConfigContext';
import { ToastProvider } from './context/ToastContext';
import { MoviesProvider, useMovies } from './context/MoviesContext';

import { Header } from './components/Header';
import { SearchBar } from './components/Search';
import { FilterSortBar } from './components/Filters';
import { MovieGrid } from './components/MovieGrid';
import {
  SettingsModal,
  PosterModal,
  ConfirmDialog,
  MovieDetailsModal,
} from './components/Modals';
import { ToastContainer } from './components/Toast';

interface AppMainProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

/**
 * AppMain renders the inner application hierarchy with access to MoviesContext.
 */
function AppMain({ isSettingsOpen, setIsSettingsOpen }: AppMainProps): React.ReactElement {
  const { deleteMovie, toggleWatched } = useMovies();

  // Modal dialog states
  const [detailsModalMovie, setDetailsModalMovie] = useState<Movie | null>(null);
  const [posterModalMovie, setPosterModalMovie] = useState<Movie | null>(null);
  const [deleteConfirmMovie, setDeleteConfirmMovie] = useState<Movie | null>(null);

  const handleOpenSettings = React.useCallback((): void => {
    setIsSettingsOpen(true);
  }, [setIsSettingsOpen]);

  const handleViewDetails = React.useCallback((movie: Movie): void => {
    setDetailsModalMovie(movie);
  }, []);

  const handleEditPoster = React.useCallback((movie: Movie): void => {
    setPosterModalMovie(movie);
  }, []);

  const handleDeleteMovie = React.useCallback((movie: Movie): void => {
    setDeleteConfirmMovie(movie);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans antialiased selection:bg-accent selection:text-accent-ink transition-colors duration-150">
      {/* 1. Sticky Header with sync indicator, theme toggle, and settings button */}
      <Header onOpenSettings={handleOpenSettings} />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Bar with debouncing, smart year extraction, media filter chips, and live results dropdown */}
        <SearchBar onOpenSettings={handleOpenSettings} onViewDetails={handleViewDetails} />

        {/* Filter and Sort Toolbar */}
        <FilterSortBar />

        {/* Responsive Movie Grid with skeleton loaders, empty states, and card action handlers */}
        <MovieGrid
          onEditPoster={handleEditPoster}
          onDeleteMovie={handleDeleteMovie}
          onViewDetails={handleViewDetails}
        />
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-line py-5 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center">
          <p>Made with ❤️ by <a href="https://github.com/Danushka-Madushan" target="_blank" rel="noopener noreferrer" className="text-white">Danushka Madushan</a></p>
        </div>
      </footer>

      {/* 4. Modal Dialogs Host Container */}
      <div id="modal-root" data-slot="modal-host">
        {/* Movie Details Modal */}
        <MovieDetailsModal
          isOpen={detailsModalMovie !== null}
          movie={detailsModalMovie}
          onClose={(): void => setDetailsModalMovie(null)}
          onToggleWatched={toggleWatched}
          onEditPoster={(movie): void => {
            setDetailsModalMovie(null);
            setPosterModalMovie(movie);
          }}
          onDelete={(movie): void => {
            setDetailsModalMovie(null);
            setDeleteConfirmMovie(movie);
          }}
        />

        {/* Settings & Credentials Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={(): void => setIsSettingsOpen(false)}
        />

        {/* Poster Editor Modal */}
        <PosterModal
          isOpen={posterModalMovie !== null}
          movie={posterModalMovie}
          onClose={(): void => setPosterModalMovie(null)}
        />

        {/* Accessible Confirmation Dialog for Deletions */}
        <ConfirmDialog
          isOpen={deleteConfirmMovie !== null}
          title="Remove from watchlist?"
          message={
            deleteConfirmMovie ? (
              <span>
                Are you sure you want to remove <strong className="text-ink">{deleteConfirmMovie.title}</strong>{' '}
                ({deleteConfirmMovie.year}) from your watchlist? This will update your collection.
              </span>
            ) : null
          }
          confirmLabel="Remove"
          cancelLabel="Keep movie"
          variant="danger"
          onConfirm={(): void => {
            if (deleteConfirmMovie) {
              const movieToDelete = deleteConfirmMovie;
              setDeleteConfirmMovie(null);
              void deleteMovie(movieToDelete.id);
            }
          }}
          onCancel={(): void => setDeleteConfirmMovie(null)}
        />
      </div>

      {/* Global Toast Notification Stack */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}

/**
 * AppContent sets up modal state and wraps children with MoviesProvider.
 */
function AppContent(): React.ReactElement {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  return (
    <MoviesProvider onOpenSettings={(): void => setIsSettingsOpen(true)}>
      <AppMain isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} />
    </MoviesProvider>
  );
}

/**
 * Root Application Component wrapping providers.
 */
export function App(): React.ReactElement {
  return (
    <ConfigProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ConfigProvider>
  );
}

export default App;
