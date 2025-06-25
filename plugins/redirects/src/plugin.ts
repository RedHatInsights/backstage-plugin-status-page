import {
  createReactExtension,
  createPlugin,
} from '@backstage/core-plugin-api';

import { catalogRouteRef, rootRouteRef, techDocsRouteRef } from './routes';

export const redirectsPlugin = createPlugin({
  id: 'redirects',
  routes: {
    root: rootRouteRef,
  },
  externalRoutes: {
    catalogDetails: catalogRouteRef,
    techDocsDetails: techDocsRouteRef,
  },
});

export const RedirectsProvider = redirectsPlugin.provide(
  createReactExtension({
    name: 'RedirectsProvider',
    component: {
      lazy: () => import('./contexts/RedirectsProvider').then(m => m.RedirectsProvider),
    },
  }),
);
