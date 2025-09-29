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
      comment: entry.content?.comment?.toString() || '0',
      file: entry.content?.file?.toString() || '0',
      node: entry.content?.node?.toString() || '0',
      rhlearnId: entry.user?.rh_jwt_user_id || 'N/A',
      media: entry.content?.media?.toString() || '0',
      group: entry.content?.group?.toString() || '0',
      group_relationship: entry.content?.group_relationship?.toString() || '0',
      content_moderation_state: entry.content?.content_moderation_state?.toString() || '0',
      cphub_alert: entry.content?.cphub_alert?.toString() || '0',
      super_sitemap_custom_url: entry.content?.super_sitemap_custom_url?.toString() || '0',
      rhlearn_progress: entry.content?.rhlearn_progress?.toString() || '0',
      red_hat_feedback_option: entry.content?.red_hat_feedback_option?.toString() || '0',
      red_hat_feedback_response: entry.content?.red_hat_feedback_response?.toString() || '0',
      red_hat_feedback_topic: entry.content?.red_hat_feedback_topic?.toString() || '0',
      firstName: entry.user?.field_first_name || 'N/A',
      lastName: entry.user?.field_last_name || 'N/A',
      created: entry.user?.created || 'N/A',
      changed: entry.user?.changed || 'N/A',
    }));
  }

  async fetchDrupalGdprData(userId: string, email: string): Promise<GdprTableData[]> {
    try {
      const baseUrl = await this.getDrupalBaseUrl();
      const url = new URL(`${baseUrl}/${userId}`);
      url.searchParams.append('email', email);
      
      const response = await this.fetchApi.fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorMessage = `No data found for user "${userId}"`;
        this.alertApi.post({
          message: errorMessage,
          severity: 'info',
          display: 'transient'
        });
        throw new Error(errorMessage);
      }

      const data: GdprApiResponse[] = await response.json();
      return this.formatUserData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.alertApi.post({
        message: 'No data found',
        severity: 'info',
        display: 'transient'
      });
      
      // Re-throw to allow calling code to handle as needed
      throw new Error(`GDPR data fetch failed: ${errorMessage}`);
    }
  }

  async fetchDrupalGdprDataByUsername(username: string, serviceNowTicket: string): Promise<GdprTableData[]> {
    try {
      const baseUrl = await this.getDrupalBaseUrl();
      const url = new URL(`${baseUrl}/username/${username}`);
      url.searchParams.append('serviceNowTicket', serviceNowTicket);
      
      const response = await this.fetchApi.fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorMessage = `No data found for username "${username}"`;
        throw new Error(errorMessage);
      }

      const data: GdprApiResponse[] = await response.json();
      return this.formatUserData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`GDPR username search failed: ${errorMessage}`);
    }
  }

  async fetchDrupalGdprDataByEmail(email: string, serviceNowTicket: string): Promise<GdprTableData[]> {
    try {
      const baseUrl = await this.getDrupalBaseUrl();
      const url = new URL(`${baseUrl}/email/${email}`);
      url.searchParams.append('serviceNowTicket', serviceNowTicket);
      
      const response = await this.fetchApi.fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorMessage = `No data found for email "${email}"`;
        throw new Error(errorMessage);
      }

      const data: GdprApiResponse[] = await response.json();
      return this.formatUserData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`GDPR email search failed: ${errorMessage}`);
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
          display: 'transient'
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
        display: 'transient'
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.alertApi.post({
        message: 'Failed to delete GDPR data',
        severity: 'error',
        display: 'transient'
      });
      
      throw new Error(`GDPR data deletion failed: ${errorMessage}`);
    }
  }


}
