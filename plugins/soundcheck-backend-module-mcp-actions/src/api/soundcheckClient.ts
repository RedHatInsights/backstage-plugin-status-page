/**
 * Soundcheck API Client
 * Handles all HTTP communications with the Soundcheck API
 */

import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { SOUNDCHECK_PLUGIN_ID } from '../utils/constants';
import type { SoundcheckItem, SoundcheckResponse, AggregationRequest } from '../types';

export class SoundcheckClient {
  constructor(
    private readonly auth: AuthService,
    private readonly discovery: DiscoveryService,
  ) {}

  /**
   * Get authentication token for Soundcheck API
   */
  private async getToken(): Promise<string> {
    const { token } = await this.auth.getPluginRequestToken({
      targetPluginId: SOUNDCHECK_PLUGIN_ID,
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
    });
    return token;
  }

  /**
   * Get base URL for Soundcheck API using Discovery service
   */
  private async getBaseUrl(): Promise<string> {
    return await this.discovery.getBaseUrl(SOUNDCHECK_PLUGIN_ID);
  }

  /**
   * Make a GET request to the Soundcheck API
   */
  async get<T = any>(path: string): Promise<SoundcheckResponse<T>> {
    const token = await this.getToken();
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a POST request to the Soundcheck API
   */
  async post<T = any>(path: string, body: any): Promise<SoundcheckResponse<T>> {
    const token = await this.getToken();
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} - ${response.statusText}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * List all checks
   */
  async listChecks(): Promise<SoundcheckItem[]> {
    const data = await this.get<SoundcheckItem>('/checks');
    return data.checks || [];
  }

  /**
   * Get a specific check by ID
   */
  async getCheck(id: string): Promise<SoundcheckItem> {
    const data = await this.get<SoundcheckItem>(`/checks/${id}`);
    return data.check!;
  }

  /**
   * List all tracks
   */
  async listTracks(params?: URLSearchParams): Promise<SoundcheckItem[]> {
    const query = params?.toString();
    const path = `/tracks${query ? `?${query}` : ''}`;
    const data = await this.get<SoundcheckItem>(path);
    return data.tracks || [];
  }

  /**
   * Get a specific track by ID
   */
  async getTrack(id: string, params?: URLSearchParams): Promise<SoundcheckItem> {
    const query = params?.toString();
    const path = `/tracks/${id}${query ? `?${query}` : ''}`;
    const data = await this.get<SoundcheckItem>(path);
    return data.track!;
  }

  /**
   * Get check results for an entity
   */
  async getResults(
    entityRef: string,
    checkIds?: string[],
    scope?: string,
    state?: 'passed' | 'failed' | 'warning' | 'not-applicable'
  ): Promise<any> {
    const params = new URLSearchParams({ entityRef });
    
    if (checkIds?.length) {
      checkIds.forEach(id => params.append('checkIds', id));
    }
    
    if (scope) {
      params.append('scope', scope);
    }
    
    if (state) {
      params.append('state', state);
    }
    
    const data = await this.get(`/results?${params.toString()}`);
    return data.results || [];
  }

  /**
   * Get aggregations
   */
  async getAggregations(request: AggregationRequest): Promise<any> {
    return this.post('/aggregations', request);
  }
}

