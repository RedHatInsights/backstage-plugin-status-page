import {
  DiscoveryApi,
  FetchApi,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { appDevRouteRef, rootRouteRef } from './routes';
import { SPAshipApi, spashipApiRef } from './api';

export const devexDashboardPlugin = createPlugin({
  id: 'devex-dashboard',
  routes: {
    root: rootRouteRef,
    appDev: appDevRouteRef,
  },
  apis: [
    {
      api: spashipApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory(deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
        return new SPAshipApi(deps);
      },
    },
  ],
});

export const DevexDashboardPage = devexDashboardPlugin.provide(
  createRoutableExtension({
    name: 'DevexDashboardPage',
    component: () =>
      import('./components/DashboardComponent').then(m => m.DashboardComponent),
    mountPoint: rootRouteRef,
  }),
);

export const AppDevDashboardPage = devexDashboardPlugin.provide(
  createRoutableExtension({
    name: 'AppDevDashboard',
    component: () =>
      import('./components/AppDevDashboard/AppDevDashboard').then(
        m => m.AppDevDashboard,
      ),
    mountPoint: appDevRouteRef,
  }),
);

export const PulseDashboardPage = devexDashboardPlugin.provide(
  createRoutableExtension({
    name: 'PulseDashboard',
    component: () =>
      import('./components/PulseDashboard/PulseDashboard').then(
        m => m.PulseDashboard,
      ),
    mountPoint: appDevRouteRef,
  }),
);

export const DataLayerDashboardPage = devexDashboardPlugin.provide(
  createRoutableExtension({
    name: 'DataLayerDashboard',
    component: () =>
      import('./components/DataLayerDashboard/DataLayerDashboard').then(
        m => m.DataLayerDashboard,
      ),
    mountPoint: appDevRouteRef,
  }),
);
