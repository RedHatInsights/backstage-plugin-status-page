/**
 * Constants for Search MCP Actions
 * Based on Backstage Search API: https://backstage.io/docs/features/search/api/query/
 */

// Plugin ID for authentication
export const SEARCH_PLUGIN_ID = 'search';

// Search document types
export const SEARCH_DOCUMENT_TYPES = {
  SOFTWARE_CATALOG: 'software-catalog',
  TECHDOCS: 'techdocs',
} as const;

// Default limits for MCP (no cursor-based pagination needed)
export const DEFAULT_SEARCH_LIMIT = 100;
export const MAX_SEARCH_LIMIT = 1000;

