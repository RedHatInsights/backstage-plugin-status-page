import {
  AlertApi,
  alertApiRef,
  createPlugin,
  createRoutableExtension,
  DiscoveryApi,
  discoveryApiRef,
  FetchApi,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { statusApiRef, StatusPageApi } from './api';
import { rootRouteRef } from './routes';

export const statusPagePlugin = createPlugin({
  id: 'status',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: statusApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        alertApi: alertApiRef,
      },
      factory(deps: {
        discoveryApi: DiscoveryApi;
        fetchApi: FetchApi;
        alertApi: AlertApi;
      }) {
        return new StatusPageApi(deps);
      },
    },
  ],
});

export const StatusPageComponent = statusPagePlugin.provide(
  createRoutableExtension({
    name: 'StatusPageComponent',
    component: () =>
      import('./components/StatusPage').then(m => m.StatusPageComponent),
    mountPoint: rootRouteRef,
  }),
);
