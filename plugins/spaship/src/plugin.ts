import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const spashipPlugin = createPlugin({
  id: 'spaship',
  routes: {
    root: rootRouteRef,
  },
});

export const SpashipPage = spashipPlugin.provide(
  createRoutableExtension({
    name: 'SpashipPage',
    component: () =>
      import('./components/SpashipPage').then(m => m.SpashipPage),
    mountPoint: rootRouteRef,
  }),
);

export const SpashipGlobalPage = spashipPlugin.provide(
  createRoutableExtension({
    name: 'SpashipPage',
    component: () =>
      import('./components/SpashipGlobalPage').then(m => m.SpashipGlobalPage),
    mountPoint: rootRouteRef,
  }),
);
