/**
 * Search API Client
 * Handles all HTTP communications with the Backstage Search API
 * 
 * Based on official Backstage Search API: https://backstage.io/docs/features/search/api/query
 */

import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { SEARCH_PLUGIN_ID } from '../utils/constants';
import type { SearchResponse } from '../types';

export class SearchClient {
  constructor(
    private readonly auth: AuthService,
    private readonly discovery: DiscoveryService,
  ) {}

  /**
   * Get authentication token for Search API
   */
  private async getToken(): Promise<string> {
    const { token } = await this.auth.getPluginRequestToken({
      targetPluginId: SEARCH_PLUGIN_ID,
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
    });
    return token;
  }

  /**
   * Get the Search API base URL
   */
  private async getBaseUrl(): Promise<string> {
    return this.discovery.getBaseUrl('search');
  }

  /**
   * Make a GET request to the Search API
   */
  private async get(path: string): Promise<SearchResponse> {
    const [token, baseUrl] = await Promise.all([
      this.getToken(),
      this.getBaseUrl(),
    ]);

    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} - ${response.statusText}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Search the catalog
   * GET /query - Query documents with a given filter
   * 
   * @param params - URL search parameters (term, types, filters, limit)
   * @returns Search response with results
   * @see https://backstage.io/docs/features/search/api/query
   */
  async search(params: URLSearchParams): Promise<SearchResponse> {
    return this.get(`/query?${params.toString()}`);
  }
}

