import { useState, useCallback } from 'react';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';
import { gdprApiRef } from '../api';
import { GdprTableData } from '../types';


export interface SearchFilters {
  platform?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasRoles?: boolean;
}

export interface UseGdprSearchReturn {
  searchResults: GdprTableData[];
  isSearching: boolean;
  searchError: string | null;
  searchStats: {
    totalResults: number;
    lastSearchTime: Date | null;
    searchDuration: number;
  };
  searchHistory: string[];
  search: (username: string, email: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
  clearHistory: () => void;
}

/**
 * Custom hook for GDPR search logic with advanced features
 */
export const useGdprSearch = (): UseGdprSearchReturn => {
  const [searchResults, setSearchResults] = useState<GdprTableData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    lastSearchTime: null as Date | null,
    searchDuration: 0,
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const gdprApi = useApi(gdprApiRef);
  const alertApi = useApi(alertApiRef);

  const search = useCallback(async (username: string, email: string, filters?: SearchFilters) => {
    if (!username.trim()) {
      alertApi.post({
        message: 'Please enter a username to search.',
        severity: 'warning',
      });
      return;
    }

    if (!email.trim()) {
      alertApi.post({
        message: 'Please enter an email address for the search.',
        severity: 'warning',
      });
      return;
    }

    const startTime = Date.now();
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await gdprApi.fetchDrupalGdprData(username.trim(), email.trim());
      
      // Apply filters if provided
      let filteredResults = results;
      if (filters) {
        if (filters.platform) {
          filteredResults = filteredResults.filter(
            result => result.platform?.toLowerCase() === filters.platform?.toLowerCase()
          );
        }
        
        if (filters.hasRoles !== undefined) {
          filteredResults = filteredResults.filter(
            result => filters.hasRoles ? result.roles && result.roles !== 'N/A' : !result.roles || result.roles === 'N/A'
          );
        }
        
        // Date range filtering would require additional date fields in the data
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      setSearchResults(filteredResults);
      setSearchStats({
        totalResults: filteredResults.length,
        lastSearchTime: new Date(),
        searchDuration: duration,
      });

      // Update search history
      setSearchHistory(prev => {
        const newHistory = [username, ...prev.filter(item => item !== username)];
        return newHistory.slice(0, 10); // Keep only last 10 searches
      });

      alertApi.post({
        message: `Found ${filteredResults.length} records for "${username}" ${duration < 1000 ? `in ${duration}ms` : `in ${(duration / 1000).toFixed(1)}s`}`,
        severity: 'success',
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      setSearchResults([]);
      
      alertApi.post({
        message: `Search failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  }, [gdprApi, alertApi]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setSearchStats({
      totalResults: 0,
      lastSearchTime: null,
      searchDuration: 0,
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchStats,
    searchHistory,
    search,
    clearResults,
    clearHistory,
  };
};
