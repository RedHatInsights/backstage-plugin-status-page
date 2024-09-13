import {
  createPlugin,
  createRoutableExtension,
  DiscoveryApi,
  discoveryApiRef,
  FetchApi,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { CMDBApi, cmdbApiRef, JiraApi, jiraApiRef } from './api';

export const hydraSupportDashboardPlugin = createPlugin({
  id: 'hydra-support-dashboard',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: jiraApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory(deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
        return new JiraApi(deps);
      },
    },
    {
      api: cmdbApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory(deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
        return new CMDBApi(deps);
      },
    },
  ],
});

export const HydraSupportDashboardPage = hydraSupportDashboardPlugin.provide(
  createRoutableExtension({
    name: 'HydraSupportDashboardPage',
    component: () =>
      import('./components/Dashboard').then(m => m.AnalyticsDashboard),
    mountPoint: rootRouteRef,
  }),
);
