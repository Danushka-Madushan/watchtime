export type MediaType = 'movie' | 'series' | 'game' | string;
export type ViewFilter = 'all' | 'todo' | 'done';
export type SortOption = 'added' | 'title' | 'year' | 'rating';

export interface Movie {
  id: string;        // IMDb ID (e.g. "tt5114356")
  title: string;     // Movie / series title
  year: string;      // Release year or range (e.g. "2017–2019" or "2013")
  type: MediaType;   // Media type ('movie', 'series', 'game', etc.)
  poster: string;    // Direct image URL or empty string
  genres: string[];  // Extracted genres list
  watched: boolean;  // Watch status
  added: string;     // ISO date YYYY-MM-DD
}

/**
 * Type guard function to validate whether an unknown value conforms to the Movie interface contract.
 */
export function isMovie(item: unknown): item is Movie {
  if (!item || typeof item !== 'object') return false;
  const m = item as Record<string, unknown>;
  if (typeof m.id !== 'string' || !/^tt\d+$/.test(m.id)) return false;
  if (typeof m.title !== 'string' || m.title.trim().length === 0) return false;
  if (typeof m.year !== 'string' || !/^\d{4}/.test(m.year)) return false;
  if (typeof m.type !== 'string' || m.type.trim().length === 0) return false;
  if (typeof m.poster !== 'string') return false;
  if (!Array.isArray(m.genres)) return false;
  for (const g of m.genres) {
    if (typeof g !== 'string') return false;
  }
  if (typeof m.watched !== 'boolean') return false;
  if (typeof m.added !== 'string' || isNaN(Date.parse(m.added))) return false;
  return true;
}
