import type {
  Movie,
  OmdbDetailResponse,
  OmdbRawSearchResponse,
  OmdbSearchResponse,
} from '../types';

const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export interface SearchMoviesParams {
  query: string;
  year?: string;
  type?: string;
  page?: number;
  apiKey: string;
}

/**
 * Search movies / series via OMDb API with error tolerance for "not found" and "too many" results.
 */
export async function searchMovies(params: SearchMoviesParams): Promise<OmdbSearchResponse> {
  const key = params.apiKey?.trim();
  if (!key) {
    throw new Error('Add your OMDb API key in settings.');
  }

  const query = params.query?.trim();
  if (!query) {
    return { items: [], total: 0 };
  }

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set('apikey', key);
  url.searchParams.set('s', query);

  if (params.year?.trim()) {
    url.searchParams.set('y', params.year.trim());
  }

  if (params.type?.trim()) {
    url.searchParams.set('type', params.type.trim());
  }

  const page = params.page && params.page > 0 ? params.page : 1;
  url.searchParams.set('page', String(page));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OMDb HTTP error: ${res.status}`);
  }

  const data: OmdbRawSearchResponse = (await res.json()) as OmdbRawSearchResponse;

  if (data.Response === 'False') {
    const errorMsg = data.Error || '';
    if (/not found|too many/i.test(errorMsg)) {
      return { items: [], total: 0 };
    }
    throw new Error(errorMsg || 'OMDb search failed');
  }

  const items = data.Search || [];
  const total = data.totalResults ? parseInt(data.totalResults, 10) || items.length : items.length;

  return { items, total };
}

/**
 * Fetch detailed movie metadata by IMDb ID.
 */
export async function getMovieById(imdbID: string, apiKey: string): Promise<OmdbDetailResponse> {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error('Add your OMDb API key in settings.');
  }

  const id = imdbID?.trim();
  if (!id) {
    throw new Error('IMDb ID is required.');
  }

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set('apikey', key);
  url.searchParams.set('i', id);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OMDb HTTP error: ${res.status}`);
  }

  const data: OmdbDetailResponse = (await res.json()) as OmdbDetailResponse;
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Movie not found on IMDb');
  }

  return data;
}

/**
 * Alias for getMovieById for compatibility.
 */
export const fetchMovieById = getMovieById;

/**
 * Refetch original poster URL for a movie ID from OMDb.
 * Returns null if poster is missing or 'N/A'.
 */
export async function refetchPoster(imdbID: string, apiKey: string): Promise<string | null> {
  const detail = await getMovieById(imdbID, apiKey);
  if (!detail.Poster || detail.Poster === 'N/A') {
    return null;
  }
  return detail.Poster;
}

/**
 * Converts an OMDb detail response into an internal domain Movie record.
 */
export function toMovie(d: OmdbDetailResponse): Movie {
  return {
    id: d.imdbID || '',
    title: d.Title,
    year: d.Year,
    type: d.Type || 'movie',
    poster: d.Poster && d.Poster !== 'N/A' ? d.Poster : '',
    genres:
      d.Genre && d.Genre !== 'N/A'
        ? d.Genre.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    watched: false,
    added: new Date().toISOString().slice(0, 10),
  };
}
