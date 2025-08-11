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

import { rootRouteRef } from './routes';
import { GDPRApi, gdprApiRef } from './api';

export const gdprPlugin = createPlugin({
  id: 'gdpr',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: gdprApiRef,
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
        return new GDPRApi(deps);
      },
    },
  ],
});

export const GdprPage = gdprPlugin.provide(
  createRoutableExtension({
    name: 'GdprPage',
    component: () =>
      import('./components/GdprPage').then(m => m.GdprComponent),
    mountPoint: rootRouteRef,
  }),
);
