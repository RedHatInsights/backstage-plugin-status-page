import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const catalogIndexPlugin = createPlugin({
  id: 'catalog-index',
  routes: {
    root: rootRouteRef,
  },
});

export const CatalogPage = catalogIndexPlugin.provide(
  createRoutableExtension({
    name: 'CatalogPage',
    component: () =>
      import('./components/CatalogPage').then(m => m.CatalogPage),
    mountPoint: rootRouteRef,
  }),
);
