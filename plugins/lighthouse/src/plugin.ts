import {
  configApiRef,
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { LighthouseApiClient, lighthouseApiRef } from './api';

import { rootRouteRef } from './routes';

export const lighthousePlugin = createPlugin({
  id: 'lighthouse-ci',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: lighthouseApiRef,
      deps: {
        configApi: configApiRef,
        fetchApi: fetchApiRef
      },
      factory: ({ configApi, fetchApi }) => new LighthouseApiClient({ configApi, fetchApi }),
    }),
  ],
});

export const LighthousePage = lighthousePlugin.provide(
  createRoutableExtension({
    name: 'LighthousePage',
    component: () =>
      import('./components/LighthousePage').then(m => m.LighthousePage),
    mountPoint: rootRouteRef,
  }),
);
