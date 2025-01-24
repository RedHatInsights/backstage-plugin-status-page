import {
  AlertApi,
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export const outageApiRef = createApiRef<StatuspageApi>({
  id: 'outages',
});

export class StatuspageApi {
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
    return `${await this.discoveryApi.getBaseUrl('proxy')}/statuspage`;
  }

  async fetchIncidents() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/incidents.json`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch incidents: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data.map((incident: any) => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        impactOverride: incident.impact_override ?? 'N/A',
        body: incident.body ?? '',
        incidentUpdates:
          incident.incident_updates?.map((update: any) => ({
            status: update.status,
            body: update.body ?? '',
          })) ?? [],
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching incidents:', error);
      this.alertApi.post({
        message: 'Failed to fetch incidents',
        severity: 'error',
      });
      return [];
    }
  }

  async createIncident(incidentData: Incident) {
    try {
      const baseUrl = await this.getBaseUrl();
      await this.fetchApi.fetch(`${baseUrl}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: incidentData }),
      });
      this.alertApi.post({
        message: 'Incident created successfully',
        severity: 'success',
      });
      return await this.fetchIncidents();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating incident:', error);
      this.alertApi.post({
        message: 'Failed to create incident',
        severity: 'error',
      });
      return [];
    }
  }

  async updateIncident(incidentId: string, updatedData: UpdateIncidentProps) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(
        `${baseUrl}/incidents/${incidentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incident: updatedData }),
        },
      );
      if (response.status === 422) {
        this.alertApi.post({
          message: 'Invalid data provided',
          severity: 'warning',
        });
        return await this.fetchIncidents();
      }
      if (!response.ok) {
        throw new Error(
          `Failed to update incident: ${response.status} ${response.statusText}`,
        );
      }
      this.alertApi.post({
        message: 'Incident updated successfully',
        severity: 'success',
      });
      return await this.fetchIncidents();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating incident:', error);
      this.alertApi.post({
        message: 'Failed to update incident',
        severity: 'error',
      });
      return [];
    }
  }

  async deleteIncident(incidentId: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      await this.fetchApi.fetch(`${baseUrl}/incidents/${incidentId}.json`, {
        method: 'DELETE',
      });
      this.alertApi.post({
        message: 'Incident deleted successfully',
        severity: 'success',
      });
      return await this.fetchIncidents();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting incident:', error);
      this.alertApi.post({
        message: 'Failed to delete incident',
        severity: 'error',
      });
      return [];
    }
  }
}
