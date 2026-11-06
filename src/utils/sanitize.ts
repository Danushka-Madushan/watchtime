import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import type { Movie, MediaType } from '../types/movie';

/**
 * Ensures DOMPurify instance is properly available across both browser
 * and simulated test environments (JSDOM/Node).
 */
function getPurifier(): typeof DOMPurify {
  if (typeof DOMPurify.sanitize === 'function') {
    return DOMPurify;
  }
  if (typeof window !== 'undefined') {
    return (DOMPurify as unknown as (win: Window) => typeof DOMPurify)(window);
  }
  return DOMPurify;
}

/**
 * Strips all HTML markup, script tags, event handlers, and malicious injections,
 * returning clean plain text.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  const purifier = getPurifier();
  return String(purifier.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })).trim();
}

/**
 * Alias for sanitizeText for compatibility.
 */
export const sanitizeString = sanitizeText;

/**
 * Sanitizes an HTML string while permitting safe markup according to DOMPurify defaults
 * or provided configuration.
 */
export function sanitizeHtml(dirty: unknown, config?: Config): string {
  if (typeof dirty !== 'string') return '';
  const purifier = getPurifier();
  return String(purifier.sanitize(dirty, config));
}

/**
 * Strictly validates whether an unknown value is a valid HTTP or HTTPS URL.
 * Explicitly rejects non-strings, javascript:, data:, vbscript:, file:, ftp:,
 * protocol-relative URLs (//foo), and malformed strings.
 */
export function isValidHttpUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Alias for isValidHttpUrl for compatibility.
 */
export const isValidUrl = isValidHttpUrl;

/**
 * Returns a sanitized URL if valid http/https, or fallback if invalid or empty.
 */
export function sanitizePosterUrl(url: unknown, fallback = ''): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  return isValidHttpUrl(trimmed) ? trimmed : fallback;
}

/**
 * Sanitizes and validates a movie record from external sources (e.g. GitHub Contents API,
 * local JSON, or user input), guaranteeing zero script injection and schema adherence.
 */
export function sanitizeMovie(item: unknown): Movie | null {
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;

  if (typeof rec.id !== 'string' || !/^tt\d+$/.test(rec.id.trim())) {
    return null;
  }
  const id = rec.id.trim();

  const title = sanitizeText(rec.title);
  if (!title) return null;

  const rawYear = typeof rec.year === 'string' ? rec.year.trim() : '';
  if (!rawYear || !/^\d{4}/.test(rawYear)) return null;
  const year = sanitizeText(rawYear);

  const cleanType = typeof rec.type === 'string' ? sanitizeText(rec.type).toLowerCase() : '';
  const type: MediaType = cleanType || 'movie';

  const poster = isValidHttpUrl(rec.poster) ? String(rec.poster).trim() : '';

  const genres: string[] = Array.isArray(rec.genres)
    ? rec.genres
        .filter((g): g is string => typeof g === 'string')
        .map((g) => sanitizeText(g))
        .filter((g) => g.length > 0)
    : [];

  const watched = typeof rec.watched === 'boolean' ? rec.watched : Boolean(rec.watched);

  const rawAdded = typeof rec.added === 'string' ? rec.added.trim() : '';
  const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(rawAdded) && !isNaN(Date.parse(rawAdded));
  const added = isDateValid ? rawAdded : new Date().toISOString().slice(0, 10);

  return {
    id,
    title,
    year,
    type,
    poster,
    genres,
    watched,
    added,
  };
}
