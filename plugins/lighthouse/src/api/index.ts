import { ConfigApi, createApiRef, FetchApi } from '@backstage/core-plugin-api';
import { TLhProject, TLhProjectBuild } from './types';

export type LighthouseAPI = {
  getProjects: (projectSlug: string) => Promise<TLhProject>;
  getProjectBuilds: (projectId: string) => Promise<TLhProjectBuild[]>;
  getProjectBuildRun: (
    projectId: string,
    buildId: string,
    url: string,
  ) => Promise<Record<string, number>>;
  getProjectBranches: (projectId: string) => Promise<{ branch: string }[]>;
  getProjectBuildUrls: (
    projectId: string,
    buildId: string,
  ) => Promise<{ url: string }[]>;
};

type Options = {
  configApi: ConfigApi;
  fetchApi: FetchApi
};

export const lighthouseApiRef = createApiRef<LighthouseAPI>({
  id: 'plugin.lighthouse-ci.service',
});

export class LighthouseApiClient implements LighthouseAPI {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;
  constructor(options: Options) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi
  }

  async getProjects(projectSlug: string): Promise<TLhProject> {
    const backendUrl = this.configApi.getString('backend.baseUrl');
    
    const res = await this.fetchApi.fetch(
      `${backendUrl}/api/proxy/lighthouse/v1/projects/slug:${projectSlug}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      },
    );

    return res.json();
  }

  async getProjectBuilds(projectId: string): Promise<TLhProjectBuild[]> {
    const backendUrl = this.configApi.getString('backend.baseUrl');
    const res = await this.fetchApi.fetch(
      `${backendUrl}/api/proxy/lighthouse/v1/projects/${projectId}/builds?limit=100&lifecycle=sealed`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      },
    );

    return res.json();
  }

  async getProjectBuildUrls(
    projectId: string,
    buildId: string,
  ): Promise<{ url: string }[]> {
    const backendUrl = this.configApi.getString('backend.baseUrl');
    const res = await this.fetchApi.fetch(
      `${backendUrl}/api/proxy/lighthouse/v1/projects/${projectId}/builds/${buildId}/urls`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      },
    );

    return res.json();
  }

  async getProjectBranches(projectId: string): Promise<{ branch: string }[]> {
    const backendUrl = this.configApi.getString('backend.baseUrl');
    const res = await this.fetchApi.fetch(
      `${backendUrl}/api/proxy/lighthouse/v1/projects/${projectId}/branches`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      },
    );

    return res.json();
  }

  async getProjectBuildRun(
    projectId: string,
    buildId: string,
    url: string,
  ): Promise<Record<string, number>> {
    const backendUrl = this.configApi.getString('backend.baseUrl');
    const res = await this.fetchApi.fetch(
      `${backendUrl}/api/proxy/lighthouse/v1/projects/${projectId}/builds/${buildId}/runs?url=${url}&representative=true`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      },
    );

    const data = await res.json();
    const scores: any[] = [];
    data.forEach((val: any) => {
      const report = JSON.parse(val.lhr);
      const score: Record<string, number> = {};
      Object.keys(report.categories).forEach((category: any) => {
        score[category] = report.categories[category].score * 100;
      });
      scores.push(score);
    });
    // add all
    const avgScore = scores.reduce((prev, curr) => {
      Object.keys(curr).forEach(category => {
        prev[category] = curr[category] + (prev?.[category] || 0);
      });
      return prev;
    }, {});
    // divide by total
    Object.keys(avgScore).forEach(cat => {
      avgScore[cat] = Math.round(avgScore[cat] / scores.length);
    });

    return avgScore;
  }
}
