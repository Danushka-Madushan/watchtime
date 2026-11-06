import { sanitizeText } from './sanitize';

/**
 * Regex matching titles ending with a 4-digit year in the range 1800-2099,
 * optionally enclosed in parentheses.
 * Captures:
 *  Group 1: Title (non-empty, ending in non-whitespace)
 *  Group 2: 4-digit release year (18xx, 19xx, 20xx)
 */
export const YEAR_REGEX = /^(.*\S)\s+\(?((?:18|19|20)\d{2})\)?$/;

export interface ParsedSearchQuery {
  title: string;
  year: string;
  rawQuery: string;
}

/**
 * Cleans user search input:
 * 1. Strips HTML/XSS payloads using DOMPurify
 * 2. Collapses whitespace
 * 3. Enforces reasonable string length cap
 */
export function cleanSearchInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  const sanitized = sanitizeText(input);
  return sanitized.replace(/\s+/g, ' ').slice(0, 200).trim();
}

/**
 * Cleans explicit year input:
 * Extracts digits and ensures it's a 4-digit year.
 */
export function cleanYearInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  const digits = input.trim().replace(/\D/g, '');
  return /^\d{4}$/.test(digits) ? digits : '';
}

/**
 * Parses user search inputs into a normalized title and release year.
 * If no explicit year is provided, extracts a trailing year from the query string.
 *
 * Examples:
 * - ("resident evil 2002", "") => { title: "resident evil", year: "2002" }
 * - ("resident evil (2002)", "") => { title: "resident evil", year: "2002" }
 * - ("blade runner 2049", "") => { title: "blade runner", year: "2049" }
 * - ("superman", "") => { title: "superman", year: "" }
 * - ("resident evil", "2002") => { title: "resident evil", year: "2002" }
 * - ("resident evil 2002", "1999") => { title: "resident evil 2002", year: "1999" }
 */
export function parseSearchQuery(rawQuery: string, rawExplicitYear = ''): ParsedSearchQuery {
  const cleanedTitle = cleanSearchInput(rawQuery);
  const explicitYear = cleanYearInput(rawExplicitYear);

  if (explicitYear) {
    return {
      title: cleanedTitle,
      year: explicitYear,
      rawQuery,
    };
  }

  const match = cleanedTitle.match(YEAR_REGEX);
  if (match && match[1] && match[2]) {
    return {
      title: match[1].trim(),
      year: match[2],
      rawQuery,
    };
  }

  return {
    title: cleanedTitle,
    year: '',
    rawQuery,
  };
}
