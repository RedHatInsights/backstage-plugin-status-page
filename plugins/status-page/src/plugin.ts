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
import { outageApiRef, StatusPageApi } from './api';
import { rootRouteRef } from './routes';

export const outageTemplatePlugin = createPlugin({
  id: 'outages',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: outageApiRef,
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

export const StatusPageComponent = outageTemplatePlugin.provide(
  createRoutableExtension({
    name: 'StatusPageComponent',
    component: () =>
      import('./components/StatusPage').then(m => m.StatusPageComponent),
    mountPoint: rootRouteRef,
  }),
);
