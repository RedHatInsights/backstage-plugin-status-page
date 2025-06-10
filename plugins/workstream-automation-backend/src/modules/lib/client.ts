import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { Workstream } from '../../types';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';

export interface WorkstreamBackendApi {
  getAllWorkstreams(): Promise<Workstream[]>;
  getWorkstreamByLocation(location: string): Promise<WorkstreamEntity>;
  getArtByLocation(location: string): Promise<ArtEntity>;
}

export class WorkstreamBackendClient implements WorkstreamBackendApi {
  constructor(
    private readonly dicovery: DiscoveryService,
    private readonly auth: AuthService,
  ) {}

  private async getPluginBaseUrl(): Promise<string> {
    return await this.dicovery.getBaseUrl('workstream');
  }

  private async getPluginServiceToken(): Promise<string> {
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'workstream',
    });
    return token;
  }

  async getAllWorkstreams(): Promise<Workstream[]> {
    const baseUrl = await this.getPluginBaseUrl();
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getPluginServiceToken()}`,
      },
    });
    return (await response.json()).data as Workstream[];
  }

  async getArtByLocation(location: string): Promise<ArtEntity> {
    const response = await fetch(location, {
      headers: {
        Authorization: `bearer ${await this.getPluginServiceToken()}`,
      },
    });
    return (await response.json()) as ArtEntity;
  }

  async getWorkstreamByLocation(location: string): Promise<WorkstreamEntity> {
    const response = await fetch(location, {
      headers: {
        Authorization: `Bearer ${await this.getPluginServiceToken()}`,
      },
    });
    return (await response.json()) as WorkstreamEntity;
  }
}
