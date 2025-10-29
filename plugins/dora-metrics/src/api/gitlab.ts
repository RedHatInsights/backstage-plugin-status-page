import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export const doraGitlabApiRef = createApiRef<DORAGitlabApi>({
  id: 'dora-metrics-gitlab',
});

export class DORAGitlabApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('proxy');
  }

  async getMergeRequests(projectId: string, dateRange: number) {
    const baseUrl = await this.getBaseUrl();
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    const dateString = date.toISOString();
    
    const response = await this.fetchApi
      .fetch(`${baseUrl}/gitlab/api/v4/projects/${projectId}/merge_requests?state=merged&created_after=${dateString.slice(0, 10)}T00:00:00Z`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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

  async getDeployments(projectId: string, environment: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi
      .fetch(`${baseUrl}/gitlab/api/v4/projects/${projectId}/deployments?per_page=200&page=1&environment=${environment}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
