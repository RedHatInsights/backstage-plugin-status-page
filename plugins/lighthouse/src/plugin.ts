import {
  configApiRef,
  createApiFactory,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { LighthouseApiClient, lighthouseApiRef } from './api';

import { rootRouteRef } from './routes';

export const lighthousePlugin = createPlugin({
  id: 'lighthouse',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: lighthouseApiRef,
      deps: {
        configApi: configApiRef,
      },
      factory: ({ configApi }) => new LighthouseApiClient({ configApi }),
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
