/**
 * Utility helper functions
 */

import type { SearchFilters } from '../types';
import { DEFAULT_SEARCH_LIMIT } from './constants';

/**
 * Build URL search params for search API
 */
export function buildSearchParams(params: {
  term: string;
  types?: string[];
  filters?: SearchFilters;
  limit?: number;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  // Add required term
  searchParams.append('term', params.term);

  // Add page limit with default for MCP usage
  const pageLimit = params.limit ?? DEFAULT_SEARCH_LIMIT;
  searchParams.append('pageLimit', pageLimit.toString());

  // Add types filter if specified
  if (params.types?.length) {
    params.types.forEach(type => searchParams.append('types', type));
  }

  // Add additional filters if specified
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(`filters[${key}]`, v));
      } else {
        searchParams.append(`filters[${key}]`, value);
      }
    });
  }

  return searchParams;
}

/**
 * Format error message
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

