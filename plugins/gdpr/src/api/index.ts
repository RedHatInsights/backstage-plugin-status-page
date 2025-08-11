import {
  AlertApi,
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import {
  GdprApiResponse,
  GdprTableData,
  DeleteRequest,
  DeleteResponse,
  UserRole,
} from '../types';

export const gdprApiRef = createApiRef<GDPRApi>({
  id: 'gdpr',
});

export class GDPRApi {
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

  private async getDrupalBaseUrl(): Promise<string> {
    const baseUrl = await this.discoveryApi.getBaseUrl('gdpr');
    return `${baseUrl}/drupal`;
  }

  private formatUserData(response: GdprApiResponse[]): GdprTableData[] {
    return response.map((entry) => ({
      platform: entry.platform,
      uid: entry.user?.uid,
      username: entry.user?.name || 'N/A',
      ssoId: entry.user?.rh_jwt_user_id || 'N/A',
      roles: entry.user?.roles?.map((r: UserRole) => r.target_id).join(', ') || 'N/A',
      comment: entry.content?.comment?.toString() || 'N/A',
      file: entry.content?.file?.toString() || 'N/A',
      node: entry.content?.node?.toString() || 'N/A',
      rhlearnId: entry.user?.rh_jwt_user_id || 'N/A',
      media: entry.content?.media?.toString() || 'N/A',
    }));
  }

  async fetchDrupalGdprData(userId: string): Promise<GdprTableData[]> {
    try {
      const baseUrl = await this.getDrupalBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorMessage = `Failed to fetch GDPR data: ${response.status} ${response.statusText}`;
        this.alertApi.post({
          message: errorMessage,
          severity: 'error',
        });
        throw new Error(errorMessage);
      }

      const data: GdprApiResponse[] = await response.json();
      return this.formatUserData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.alertApi.post({
        message: 'Failed to fetch GDPR data',
        severity: 'error',
      });
      
      // Re-throw to allow calling code to handle as needed
      throw new Error(`GDPR data fetch failed: ${errorMessage}`);
    }
  }


  async deleteDrupalGDPRData(requests: DeleteRequest[]): Promise<DeleteResponse[]> {
    try {
      const baseUrl = await this.getDrupalBaseUrl();
      
      const response = await this.fetchApi.fetch(`${baseUrl}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
      });

      if (!response.ok) {
        const errorMessage = `Failed to delete GDPR data: ${response.status} ${response.statusText}`;
        this.alertApi.post({
          message: errorMessage,
          severity: 'error',
        });
        throw new Error(errorMessage);
      }

      const data: DeleteResponse[] = await response.json();
      
      // Show success message with summary
      const successCount = data.filter(r => r.success).length;
      const totalCount = data.length;
      
      this.alertApi.post({
        message: `Successfully processed ${successCount}/${totalCount} delete requests`,
        severity: successCount === totalCount ? 'success' : 'warning',
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.alertApi.post({
        message: 'Failed to delete GDPR data',
        severity: 'error',
      });
      
      throw new Error(`GDPR data deletion failed: ${errorMessage}`);
    }
  }


}
