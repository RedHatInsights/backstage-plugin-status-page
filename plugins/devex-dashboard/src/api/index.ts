import {
  DiscoveryApi,
  FetchApi,
  createApiRef,
} from '@backstage/core-plugin-api';

export const devexApiRef = createApiRef<DevexDashboardApi>({
  id: 'devex-dasboard',
});

export class DevexDashboardApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('proxy');
  }

  async getDeploymentCountByEnv() {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi
      .fetch(`${baseUrl}/spaship/v1/analytics/deployment/env`, {
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

  async getAverageDeploymentTimeByDays(days = 30) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi
      .fetch(`${baseUrl}/spaship/v1/analytics/deployment/time?days=${days}`, {
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

  async deployedPropertyCount() {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi
      .fetch(`${baseUrl}/spaship/v1/analytics/deployment/count`, {
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

  async getDocsbotStats() {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi
      .fetch(`${baseUrl}/docsbotstats/feedback/stats`, {
        method: 'GET',
      })
      .then(data => {
        return data.json();
      })
      .catch(_err => {
        return null;
      });
    return response;
  }

  async getMatomoPageUrls(period: string, range: string, siteId: string) {
    const baseUrl = await this.discoveryApi.getBaseUrl('matomo');
    const response = await this.fetchApi
      .fetch(`${baseUrl}?module=API&format=JSON`, {
        method: 'POST',
        body: new URLSearchParams({
          idSite: siteId,
          method: 'API.getProcessedReport',
          period: period,
          date: range,
          apiModule: 'Actions',
          apiAction: 'getPageUrls',
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
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

  async getSplunkSubgraphs() {
    const baseUrl = await this.discoveryApi.getBaseUrl('devex-data-layer');
    const response = await this.fetchApi
      .fetch(`${baseUrl}/subgraphs`, {
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

  async getSplunkDataBySubgraph(subgraph: string) {
    const baseUrl = await this.discoveryApi.getBaseUrl('devex-data-layer');
    const response = await this.fetchApi
      .fetch(`${baseUrl}/search?subgraph=${subgraph}`, {
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

  async getSubgraphNames() {
    const baseUrl =  await this.getBaseUrl();
    const response = await this.fetchApi
      .fetch(`${baseUrl}/subgraphs`, {
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
