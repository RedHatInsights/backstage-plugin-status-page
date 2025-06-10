import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { ART, Workstream } from '../types';

export const workstreamApiRef = createApiRef<WorkstreamApi>({
  id: 'workstream',
});

export class WorkstreamApi {
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

export const artApiRef = createApiRef<ArtApi>({
  id: 'workstream-automation.art',
});

export class ArtApi {
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
    return `${await this.discoveryApi.getBaseUrl('workstream')}/art`;
  }

  private async getCurrentUserRef(): Promise<string> {
    return (await this.identityApi.getBackstageIdentity()).userEntityRef;
  }

  async createNewArt(data: ART) {
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
        } as ART,
      }),
    });
    return await resp.json();
  }
  async deleteArt(workstreamName: string) {
    const baseUrl = await this.getBaseUrl();
    const resp = await this.fetchApi.fetch(`${baseUrl}/${workstreamName}`, {
      method: 'DELETE',
    });
    return await resp.json();
  }

  async updateArt(workstreamName: string, data: Workstream) {
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
