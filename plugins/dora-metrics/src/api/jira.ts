import {
    createApiRef,
    DiscoveryApi,
    FetchApi,
  } from '@backstage/core-plugin-api';
  
  export const doraJiraApiRef = createApiRef<DORAJiraApi>({
    id: 'dora-metrics-jira',
  });
  
  export class DORAJiraApi {
    private discoveryApi: DiscoveryApi;
    private fetchApi: FetchApi;
  
    constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
      this.discoveryApi = options.discoveryApi;
      this.fetchApi = options.fetchApi;
    }
  
    private async getBaseUrl(): Promise<string> {
      return await this.discoveryApi.getBaseUrl('proxy');
    }
  
    async getJiraDetails(jiraNumber: string) {
      const baseUrl = await this.getBaseUrl();
      const response = await this.fetchApi
        .fetch(`${baseUrl}/jira/rest/api/2/issue/${jiraNumber}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        .then(data => {
            if(data.status === 200) {
                return data.json();
            }
            return null;
        })
        .catch(_err => {
          return null;
        });
      return response;
    }
  }
  