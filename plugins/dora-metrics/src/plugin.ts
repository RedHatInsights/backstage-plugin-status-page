import {
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { doraGitlabApiRef, DORAGitlabApi } from './api/gitlab';
import { DORAJiraApi, doraJiraApiRef } from './api/jira';

export const doraMetricsPlugin = createPlugin({
  id: 'dora-metrics',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: doraGitlabApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory(deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
        return new DORAGitlabApi(deps);
      },
    },
    {
      api: doraJiraApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory(deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
        return new DORAJiraApi(deps);
      },
    },
  ],
});

export const DoraMetricsPage = doraMetricsPlugin.provide(
  createRoutableExtension({
    name: 'DoraMetricsPage',
    component: () =>
      import('./components/Dashboard').then(m => m.DashboardComponent),
    mountPoint: rootRouteRef,
  }),
);
