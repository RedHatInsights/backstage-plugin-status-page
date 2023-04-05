import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const matomoPlugin = createPlugin({
  id: 'matomo',
  routes: {
    root: rootRouteRef,
  },
});

export const MatomoPage = matomoPlugin.provide(
  createRoutableExtension({
    name: 'MatomoPage',
    component: () => import('./components/MatomoPage').then(m => m.MatomoPage),
    mountPoint: rootRouteRef,
  }),
);
