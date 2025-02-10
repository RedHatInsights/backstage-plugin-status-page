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
import { outageApiRef, StatuspageApi } from './api';
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
        return new StatuspageApi(deps);
      },
    },
  ],
});

export const OutageTemplatePage = outageTemplatePlugin.provide(
  createRoutableExtension({
    name: 'OutageTemplatePage',
    component: () =>
      import('./components/OutagePage').then(m => m.OutageComponent),
    mountPoint: rootRouteRef,
  }),
);
