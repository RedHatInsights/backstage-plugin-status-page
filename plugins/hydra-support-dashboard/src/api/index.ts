import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export const jiraApiRef = createApiRef<JiraApi>({
  id: 'jira',
});

export const cmdbApiRef = createApiRef<CMDBApi>({
  id: 'cmdb',
});

export const dataLayerApiRef = createApiRef<DTLApi>({
  id: 'devex-data-layer',
});

export class JiraApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('proxy');
  }

  async getCombinedEpicData(epicList: string[]) {
    const baseUrl = await this.getBaseUrl();
    const jqlQuery = encodeURIComponent(
      `"Epic Link" in (${epicList.toString()})`,
    );
    const resp = await this.fetchApi.fetch(
      `${baseUrl}/jira/rest/api/2/search?jql=${jqlQuery}&maxResults=500`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return await resp.json();
  }

  async getConfig() {
    const baseUrl = await this.getBaseUrl();
    const resp = await this.fetchApi.fetch(`${baseUrl}/hydrasupport`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await resp.json();
  }
}

export class CMDBApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('proxy');
  }

  async getCMDBData() {
    const baseUrl = await this.getBaseUrl();
    const cmdbQuery = encodeURIComponent(`nameLIKEHydra`);
    const resp = await this.fetchApi.fetch(
      `${baseUrl}/cmdb/api/now/table/cmdb_ci_business_app?sysparm_query=${cmdbQuery}&sysparm_fields=name,business_criticality,u_application_id`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return await resp.json();
  }
}

export class DTLApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getNotificationsSplunkStats(endpoint: string) {
    const baseUrl = await this.discoveryApi.getBaseUrl('devex-data-layer');
    const response = await this.fetchApi
      .fetch(`${baseUrl}/hydra/notifications/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(data => {
        return data.json();
      })
      .catch(_err => {
        return null;
      });
    return response;
  }

  async getAttachmentsSplunkStats(endpoint: string) {
    const baseUrl = await this.discoveryApi.getBaseUrl('devex-data-layer');
    const response = await this.fetchApi
      .fetch(`${baseUrl}/hydra/attachments/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(data => {
        return data.json();
      })
      .catch(_err => {
        return null;
      });
    return response;
  }
}
