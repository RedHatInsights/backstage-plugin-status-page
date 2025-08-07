import {
  AlertApi,
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export const permissionManagementApiRef = createApiRef<PermissionManagementApi>({
  id: 'permission-management',
});

export class PermissionManagementApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;
  private alertApi: AlertApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    alertApi: AlertApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.alertApi = options.alertApi;
  }

  private async getBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('permission-management')}`;
  }

  async getAllAccessRequests(): Promise<any[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/access`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      
      if (response?.status === 204) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch access requests: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      this.alertApi.post({
        message: 'Failed to fetch access requests',
        severity: 'error',
      });
      return [];
    }
  }

  async updateAccessRequests(
    updates: {
      userId: string;
      group: string;
      role: string;
      reviewer: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
      updatedBy: string;
    }[],
    accessToken: string
  ): Promise<any[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'hydra_token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update access requests: ${response.status} ${response.statusText}`,
        );
      }

      this.alertApi.post({
        message: 'Access request(s) updated successfully',
        severity: 'success',
      });

      return await this.getAllAccessRequests();
    } catch (error) {
      this.alertApi.post({
        message: 'Failed to update access requests',
        severity: 'error',
      });
      return [];
    }
  }


  async checkUserAccessStatus(
    groupCn: string,
    userId: string,
    accessToken: string,
    role?: 'member' | 'owner'
  ): Promise<{ isMember?: boolean; isOwner?: boolean }> {
    try {
      const baseUrl = await this.getBaseUrl();
      const url = new URL(
        `${baseUrl}/access/check/${groupCn}/user/${userId}`
      );

      if (role) {
        url.searchParams.append('role', role);
      }

      const response = await this.fetchApi.fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'hydra_token': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to check user access status: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      this.alertApi.post({
        message: 'Failed to check user access status',
        severity: 'error',
      });
      return {};
    }
  }

}
