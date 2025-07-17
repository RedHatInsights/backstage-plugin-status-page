import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { Workstream } from '../types';

export const workstreamApiRef = createApiRef<WorkstreamApiClient>({
  id: 'workstream',
});

export class WorkstreamApiClient {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;
  private identityApi: IdentityApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.identityApi = options.identityApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('workstream');
  }

  private async getCurrentUserRef(): Promise<string> {
    return (await this.identityApi.getBackstageIdentity()).userEntityRef;
  }

  async createNewWorkstream(data: Workstream) {
    const baseUrl = await this.getBaseUrl();
    const createdBy = await this.getCurrentUserRef();
    const resp = await this.fetchApi.fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...data,
          createdBy,
          updatedBy: createdBy,
        },
      }),
    });
    return await resp.json();
  }
  async deleteWorkstream(workstreamName: string) {
    const baseUrl = await this.getBaseUrl();
    const resp = await this.fetchApi.fetch(`${baseUrl}/${workstreamName}`, {
      method: 'DELETE',
    });
    return await resp.json();
  }

  async updateWorkstream(workstreamName: string, data: Workstream) {
    if (data.name) {
      const baseUrl = await this.getBaseUrl();
      const updatedBy = await this.getCurrentUserRef();
      const resp = await this.fetchApi.fetch(`${baseUrl}/${workstreamName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { ...data, updatedBy },
        }),
      });
      return await resp.json();
    }
    throw new Error('workstream name not found');
  }
}
