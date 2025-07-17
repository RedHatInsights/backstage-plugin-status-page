import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { ART } from '../types';

export const artApiRef = createApiRef<ArtApiClient>({
  id: 'workstream-automation.art',
});

export class ArtApiClient {
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
  async deleteArt(artName: string) {
    const baseUrl = await this.getBaseUrl();
    const resp = await this.fetchApi.fetch(`${baseUrl}/${artName}`, {
      method: 'DELETE',
    });
    return await resp.json();
  }

  async updateArt(artName: string, data: ART) {
    if (data.name) {
      const baseUrl = await this.getBaseUrl();
      const updatedBy = await this.getCurrentUserRef();
      const resp = await this.fetchApi.fetch(`${baseUrl}/${artName}`, {
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
    throw new Error('art name not found');
  }
}
