import { LoggerService } from '@backstage/backend-plugin-api';
import {
  MCPRegistryServer,
  MCPRegistryProviderConfig,
  PagedResponse,
} from '../types';

export class MCPRegistryClient {
  private readonly config: MCPRegistryProviderConfig;
  private readonly logger: LoggerService;

  constructor(options: {
    config: MCPRegistryProviderConfig;
    logger: LoggerService;
  }) {
    this.config = options.config;
    this.logger = options.logger;
  }

  /**
   * A private method to make HTTP requests.
   * 
   * @param {string} endpoint - The endpoint to send the request to.
   * @param {RequestInit} [init] - Optional request initialization object.
   * @returns {Promise<T>} - A promise that resolves to the JSON response.
   * @throws {Error} - Throws an error if the response status is not ok.
   */
  private async request<T = any>(
    endpoint: string,
    init?: RequestInit,
  ): Promise<T> {
    const url = new URL(endpoint, this.config.apiBaseUrl);

    const resp = await fetch(url, init);

    if (!resp.ok) {
      throw new Error(resp.statusText);
    }

    return resp.json();
  }

  /**
   * A private method to make paged requests to an API endpoint.
   *
   * @see {@link paginated}
   * @param {string} endpoint - The API endpoint to request.
   * @param {Record<string, string | undefined>} [params] - Optional query parameters.
   * @returns {Promise<PagedResponse<T[]>>} - A promise that resolves to a PagedResponse object.
   */
  private async pagedRequest<T>(
    endpoint: string,
    params?: Record<string, string | undefined>,
  ): Promise<PagedResponse<T[]>> {
    const url = new URL(endpoint, this.config.apiBaseUrl);

    for (const param in params) {
      if (param) {
        url.searchParams.append(param, params[param]?.toString() || '');
      }
    }

    this.logger.debug(`Fetching: ${url.toString()}`);
    return this.request<PagedResponse<T[]>>(endpoint);
  }

  /**
   * Asynchronously lists servers with optional query parameters.
   *
   * @param {Record<string, string>} [params] - Optional query parameters.
   * @returns {Promise<PagedResponse<MCPRegistryServer[]>>} A promise that resolves to a paginated response containing an array of MCPRegistryServer objects.
   * @throws {Error} If the request fails or the response is not ok.
   */
  async listServers(
    params?: Record<string, string | undefined>,
  ): Promise<PagedResponse<MCPRegistryServer[]>> {
    const endpoint = 'servers';
    return this.pagedRequest<MCPRegistryServer>(endpoint, params);
  }

  /**
   * Asynchronously fetches a server from the API by its ID.
   *
   * @param {string} id - The unique identifier of the server.
   * @returns {Promise<MCPRegistryServer>} - A promise that resolves with the server object.
   * @throws {Error} Will throw an error if the request fails.
   */
  async getServer(id: string): Promise<MCPRegistryServer> {
    const endpoint = `servers/${id}`;
    return this.request<MCPRegistryServer>(endpoint);
  }
}

/**
 * Asynchronously iterates over paginated API responses, yielding each item from all pages.
 *
 * @see {@link pagedRequest}
 * @template T - The type of items in the paginated response array.
 * @param request - A function that takes an endpoint string and returns a promise resolving to a paged response.
 * @param endpoint - The initial endpoint to start fetching data from.
 * @yields Each item from the paginated response across all pages.
 */
export async function* paginated<T extends any[]>(
  request: (params: Record<string, string>) => Promise<PagedResponse<T>>,
  params: Record<string, string>,
) {
  let response;
  let activeParams = params;
  do {
    response = await request(activeParams);
    if (response.next) {
      const search = new URL(response.next).searchParams;
      activeParams = {
        ...activeParams,
        limit: search.get('limit') || activeParams.limit,
        offset: search.get('offset') || activeParams.offset,
      };
    }

    for (const server of response.servers) {
      yield server;
    }
  } while (response.next);
}
