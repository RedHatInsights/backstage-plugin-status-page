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
    return `${await this.discoveryApi.getBaseUrl('outage-template-backend')}`;
  }

  async fetchIncidents() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/incidents`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json',
          accept: 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch incidents: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data.data.map((incident: any) => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        impactOverride: incident.impact_override ?? 'N/A',
        body: incident.body ?? '',
        components: incident.components,
        incidentUpdates:
          incident.incident_updates?.map((update: any) => ({
            body: update.body ?? '',
            status: update.status ?? '',
            createdAt: update.created_at ?? '',
          })) ?? [],
        scheduledFor: incident.scheduled_for,
        scheduledUntil: incident.scheduled_until,
        scheduledAutoCompleted: incident.scheduled_auto_completed,
        startedAt: incident.started_at,
        resolvedAt: incident.resolved_at,
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

  async fetchIncident(id: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/incidents/${id}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch incident: ${response.status} ${response.statusText}`,
        );
      }
      const result = await response.json();
      const incident = result.data;
      const formattedIncident = {
        id: incident.id,
        name: incident.name,
        status: incident.status,
        impact: incident.impact ?? 'unknown',
        impactOverride: incident.impact_override ?? 'N/A',
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        monitoringAt: incident.monitoring_at,
        body: incident.body ?? '',
        postmortem_body: incident.postmortem_body ?? '',
        resolvedAt: incident.resolved_at,
        scheduledFor: incident.scheduled_for,
        scheduledUntil: incident.scheduled_until,
        scheduledAutoCompleted: incident.scheduled_auto_completed,
        components: [],
        incidentUpdates: [],
      };
      formattedIncident.components = Array.isArray(incident.components)
        ? incident.components.map((comp: any) => ({
            id: comp.id,
            name: comp.name,
            status: comp.status,
            groupId: comp.group_id,
            updatedAt: comp.updated_at,
            createdAt: comp.created_at,
            startDate: comp.start_date,
          }))
        : [];
      formattedIncident.incidentUpdates = Array.isArray(
        incident.incident_updates,
      )
        ? incident.incident_updates.map((update: any) => ({
            id: update.id,
            status: update.status,
            body: update.body ?? '',
            createdAt: update.created_at,
            updatedAt: update.updated_at,
            affectedComponents: Array.isArray(update.affected_components)
              ? update.affected_components.map((ac: any) => ({
                  code: ac.code,
                  name: ac.name,
                  oldStatus: ac.old_status,
                  newStatus: ac.new_status,
                }))
              : [],
          }))
        : [];
      return formattedIncident;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching incident:', error);
      throw new Error(`Failed to fetch incident`);
    }
  }

  async fetchComponents() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/components`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch components: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      const groupedData = await this.listComponentsWithinGroups(data.data);
      return groupedData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching components:', error);
      this.alertApi.post({
        message: 'Failed to fetch components',
        severity: 'error',
      });
      return [];
    }
  }

  async createIncident(incidentData: StatusPageIncident) {
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
      await this.fetchApi.fetch(`${baseUrl}/incidents/${incidentId}`, {
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

  async listComponentsWithinGroups(data: any) {
    const groups: any = {};
    const groupIdToName: any = {};
    for (const item of data) {
      if (item.group === true) {
        groupIdToName[item.id] = item.name;
        groups[item.name] = [];
      }
    }
    for (const item of data) {
      if (item.group === false) {
        const groupName = item.group_id ? groupIdToName[item.group_id] : null;
        const targetGroup = groupName || 'Others';

        if (!groups[targetGroup]) {
          groups[targetGroup] = [];
        }
        groups[targetGroup].push(item);
      }
    }
    return groups;
  }

  async savePostmortemDraft(incidentId: string, postmortemDescription: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      await this.fetchApi.fetch(`${baseUrl}/postmortem/${incidentId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postmortem: { body_draft: postmortemDescription },
        }),
      });

      return {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving draft:', error);
      this.alertApi.post({
        message: 'Failed to save postmortem draft!',
        severity: 'error',
      });
      return [];
    }
  }

  async publishPostmortem(incidentId: string, postmortemDescription: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      await this.fetchApi.fetch(`${baseUrl}/postmortem/${incidentId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postmortem: { body_draft: postmortemDescription },
        }),
      });
      this.alertApi.post({
        message: 'Postmortem published successfully',
        severity: 'success',
      });
      return await this.fetchIncidents();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error publishing postmortem:', error);
      this.alertApi.post({
        message: 'Failed to publish postmortem!',
        severity: 'error',
      });
      return [];
    }
  }

  async fetchTemplates() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/templates`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch templates: ${response.status} ${response.statusText}`,
        );
      }
      return await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async createTemplate(templateData: TemplateBody) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to create template: ${response.status} ${response.statusText}`,
        );
      }
      this.alertApi.post({
        message: 'Template created successfully',
        severity: 'success',
      });
      return await this.fetchTemplates();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating template:', error);
      this.alertApi.post({
        message: 'Failed to create template',
        severity: 'error',
      });
      return null;
    }
  }

  async updateTemplate(templateData: TemplateBody) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(`${baseUrl}/templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to update template: ${response.status} ${response.statusText}`,
        );
      }
      this.alertApi.post({
        message: 'Template updated successfully',
        severity: 'success',
      });
      return await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating template:', error);
      this.alertApi.post({
        message: 'Failed to update template',
        severity: 'error',
      });
      return null;
    }
  }

  async deleteTemplate(templateId: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi.fetch(
        `${baseUrl}/templates/${templateId}`,
        {
          method: 'DELETE',
        },
      );
      this.alertApi.post({
        message: 'Template deleted successfully',
        severity: 'success',
      });
      return await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting template:', error);
      this.alertApi.post({
        message: 'Failed to delete template',
        severity: 'error',
      });
      return null;
    }
  }
}
