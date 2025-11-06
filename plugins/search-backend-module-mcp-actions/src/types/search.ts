/**
 * Search domain types
 * Based on Backstage Search API
 */

export type SearchResult = {
  type: string;
  document: {
    title: string;
    text: string;
    location: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export type SearchResponse = {
  results: SearchResult[];
  [key: string]: any;
};

export type SearchFilters = Record<string, string | string[]>;

